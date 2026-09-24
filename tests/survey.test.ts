// tests/survey.test.ts
// Verifies survey lifecycle, temporal boundaries, idempotence, and queue recovery in memory.
import test from "node:test";
import assert from "node:assert/strict";
import {
  createSurveyId,
  createEventId,
  createLikertItemCode,
  createRespondentCategoryCode,
  createSubmissionId,
  getActiveSurvey,
  startSurveyParticipation,
  submitSurvey,
  acceptSurveySubmission,
  createSynchronizePendingSubmissions,
} from "../src/modules/survey";
// Internal imports are limited to fixture construction and in-memory adapter doubles.
import { createSurvey } from "../src/modules/survey/domain/survey";
import { createSurveySchedule } from "../src/modules/survey/domain/survey-schedule";
import { createSurveySubmission } from "../src/modules/survey/domain/survey-submission";
import type { SurveyProvider } from "../src/modules/survey/ports/survey-provider.port";
import type { SurveySubmissionRepository, AcceptedSurveySubmissionRecord } from "../src/modules/survey/ports/survey-submission-repository.port";
import type { LocalSubmissionStore, LocalSubmissionRecord } from "../src/modules/survey/ports/local-submission-store.port";
import type { SurveySubmissionGateway } from "../src/modules/survey/ports/survey-submission-gateway.port";


const date = (ms: number) => new Date(ms);
const category = createRespondentCategoryCode("student");
const item = createLikertItemCode("social");
const schedule = createSurveySchedule({ opensAt: date(1000), closesAt: date(2000), acceptSubmissionsUntil: date(3000) });
const survey = createSurvey({ id: createSurveyId("survey"), eventId: createEventId("event"), title: "Survey", instructions: "Answer", schedule,
  respondentCategories: [{ code: category, label: "Student" }],
  items: [{ code: item, dimension: "Social", statement: "Statement", order: 1 }] });
const draft = { surveyId: survey.id, respondentCategoryCode: category, answers: [{ itemCode: item, value: 7 as const }] };
const submission = (id = "one") => createSurveySubmission({ submissionId: createSubmissionId(id), survey, ...draft });

function setup() {
  const accepted = new Map<string, AcceptedSurveySubmissionRecord>();
  const local = new Map<string, LocalSubmissionRecord>();
  const provider: SurveyProvider = {
    findByEventId: async () => ({ status: "FOUND", survey }),
    findById: async (id) => id === survey.id ? survey : null,
  };
  const repository: SurveySubmissionRepository = {
    findById: async (id) => accepted.get(id) ?? null,
    saveIfAbsent: async (record) => {
      const existing = accepted.get(record.submission.submissionId);
      if (existing) return { status: "ALREADY_EXISTS", record: existing };
      accepted.set(record.submission.submissionId, record);
      return { status: "SAVED", record };
    },
  };
  const store: LocalSubmissionStore = {
    savePending: async (s) => { if (!local.has(s.submissionId)) local.set(s.submissionId, { submission: s, syncState: "PENDING" }); },
    listPendingInQueueOrder: async () => [...local.values()].filter((r): r is Extract<LocalSubmissionRecord, { syncState: "PENDING" }> => r.syncState === "PENDING"),
    markSynced: async (id, acceptedAt) => { const r = local.get(id)!; local.set(id, { submission: r.submission, syncState: "SYNCED", acceptedAt }); },
    markRejected: async (id, reason) => { const r = local.get(id)!; local.set(id, { submission: r.submission, syncState: "REJECTED", reason }); },
  };
  const dependencies = { surveyProvider: provider, submissionRepository: repository };
  const gateway: SurveySubmissionGateway = { submit: (s) => acceptSurveySubmission(dependencies, { ...s, now: date(2500) }) };
  let id = 0;
  const client = { localSubmissionStore: store, submissionGateway: gateway, submissionIdGenerator: { generate: () => createSubmissionId(`id-${++id}`) } };
  return { accepted, local, provider, repository, store, dependencies, gateway, client };
}

test("schedule validates timestamps, ordering, boundaries and defensive copies", () => {
  assert.throws(() => createSurveySchedule({ opensAt: date(2), closesAt: date(2), acceptSubmissionsUntil: date(3) }));
  assert.throws(() => createSurveySchedule({ opensAt: date(1), closesAt: date(3), acceptSubmissionsUntil: date(2) }));
  assert.throws(() => schedule.availabilityAt(date(NaN)));
  assert.deepEqual([999, 1000, 1999, 2000, 3000, 3001].map((n) => schedule.availabilityAt(date(n))), ["UPCOMING", "OPEN", "OPEN", "SYNC_ONLY", "SYNC_ONLY", "CLOSED"]);
  schedule.opensAt.setTime(0);
  assert.equal(schedule.opensAt.getTime(), 1000);
});

test("lookup distinguishes event missing and survey not configured", async () => {
  const f = setup();
  for (const status of ["EVENT_NOT_FOUND", "SURVEY_NOT_CONFIGURED"] as const) {
    const result = await getActiveSurvey({ surveyProvider: { ...f.provider, findByEventId: async () => ({ status }) } }, { eventId: survey.eventId, now: date(1500) });
    assert.equal(result.status, status);
  }
});

test("five use cases close the offline cycle and preserve shared-device responses", async () => {
  const f = setup();
  const active = await getActiveSurvey({ surveyProvider: f.provider }, { eventId: survey.eventId, now: date(1500) });
  assert.equal(active.status, "FOUND");
  const started = startSurveyParticipation({ survey, now: date(1500) });
  assert.equal(started.status, "STARTED");
  if (started.status !== "STARTED") throw new Error("Expected draft");
  const offline: SurveySubmissionGateway = { submit: async () => ({ status: "RETRYABLE_FAILURE", reason: "TRANSPORT_UNAVAILABLE" }) };
  for (let i = 0; i < 2; i++) {
    const result = await submitSurvey({ ...f.client, submissionGateway: offline }, { survey, draft: { ...started.draft, ...draft }, now: date(1500) });
    assert.equal(result.status, "PENDING");
  }
  assert.equal(f.local.size, 2);
  const sync = createSynchronizePendingSubmissions({ localSubmissionStore: f.store, submissionGateway: f.gateway });
  assert.deepEqual(await sync(), { status: "COMPLETED", attempted: 2, synced: 2, rejected: 0, remainingPending: 0 });
  assert.equal(f.accepted.size, 2);
  assert.equal((await sync()).attempted, 0);
});

test("online submit succeeds; closed draft never generates an ID or queues", async () => {
  const f = setup();
  assert.equal((await submitSurvey(f.client, { survey, draft, now: date(1500) })).status, "SYNCED");
  for (const now of [999, 2000, 3001]) {
    assert.equal(startSurveyParticipation({ survey, now: date(now) }).status, "SURVEY_NOT_OPEN");
    const result = await submitSurvey({ ...f.client, submissionIdGenerator: { generate: () => { throw new Error("Must not generate"); } } }, { survey, draft, now: date(now) });
    assert.equal(result.status, "SURVEY_NOT_OPEN");
  }
  assert.equal(f.local.size, 1);
});

test("validation rejects missing, duplicate, unknown and out-of-range answers", () => {
  for (const answers of [[], [{ itemCode: item, value: 0 }], [{ itemCode: item, value: 8 }], [{ itemCode: item, value: 1.5 }], [{ itemCode: item, value: NaN }], [{ itemCode: createLikertItemCode("unknown"), value: 1 }], [{ itemCode: item, value: 1 }, { itemCode: item, value: 2 }]]) {
    assert.throws(() => createSurveySubmission({ submissionId: createSubmissionId("bad"), survey, respondentCategoryCode: category, answers }));
  }
  assert.throws(() => createSurveySubmission({ ...submission(), survey, respondentCategoryCode: createRespondentCategoryCode("unknown") }));
  assert.throws(() => createSurvey({ ...survey, items: [survey.items[0], survey.items[0]] }));
  assert.throws(() => createSurvey({ ...survey, respondentCategories: [survey.respondentCategories[0], survey.respondentCategories[0]] }));
});

test("invalid draft and mismatched survey have no local or remote effect", async () => {
  const f = setup();
  for (const invalid of [{ ...draft, answers: [] }, { surveyId: survey.id, answers: [] }, { ...draft, surveyId: createSurveyId("other") }]) {
    assert.equal((await submitSurvey(f.client, { survey, draft: invalid, now: date(1500) })).status, "INVALID_DRAFT");
  }
  assert.equal(f.local.size, 0);
  assert.equal(f.accepted.size, 0);
});

test("submission is deeply frozen and detached from draft answers", () => {
  const answers = [{ itemCode: item, value: 7 }];
  const s = createSurveySubmission({ submissionId: createSubmissionId("immutable"), survey, respondentCategoryCode: category, answers });
  answers[0].value = 1;
  assert.equal(s.answers[0].value, 7);
  assert.ok(Object.isFrozen(s) && Object.isFrozen(s.answers) && Object.isFrozen(s.answers[0]));
});

test("server accepts only in acceptance window and revalidates content", async () => {
  const f = setup();
  for (const [now, reason] of [[999, "SURVEY_NOT_OPEN"], [3001, "SURVEY_CLOSED"]] as const) {
    assert.deepEqual(await acceptSurveySubmission(f.dependencies, { ...submission(), now: date(now) }), { status: "REJECTED", reason });
  }
  assert.deepEqual(await acceptSurveySubmission(f.dependencies, { ...submission(), answers: [], now: date(1500) }), { status: "REJECTED", reason: "INVALID_SUBMISSION" });
  assert.deepEqual(await acceptSurveySubmission(f.dependencies, { ...submission(), surveyId: createSurveyId("absent"), now: date(1500) }), { status: "REJECTED", reason: "UNKNOWN_SURVEY" });
  assert.equal((await acceptSurveySubmission(f.dependencies, { ...submission(), now: date(3000) })).status, "ACCEPTED");
});

test("lost acknowledgment is recovered after closure without duplicate persistence", async () => {
  const f = setup();
  const first = await acceptSurveySubmission(f.dependencies, { ...submission(), now: date(1500) });
  const retry = await acceptSurveySubmission(f.dependencies, { ...submission(), now: date(4000) });
  assert.equal(first.status, "ACCEPTED");
  assert.deepEqual(retry, { status: "ALREADY_ACCEPTED", acceptedAt: date(1500) });
  const conflict = await acceptSurveySubmission(f.dependencies, { ...submission(), answers: [{ itemCode: item, value: 1 }], now: date(4000) });
  assert.deepEqual(conflict, { status: "REJECTED", reason: "SUBMISSION_CONFLICT" });
  assert.equal(f.accepted.size, 1);
});

test("atomic repository contract resolves concurrent duplicate submissions", async () => {
  const f = setup();
  const results = await Promise.all([1, 2].map(() => acceptSurveySubmission(f.dependencies, { ...submission(), now: date(1500) })));
  assert.deepEqual(results.map((r) => r.status).sort(), ["ACCEPTED", "ALREADY_ACCEPTED"]);
  assert.equal(f.accepted.size, 1);
});

test("FIFO continues after rejection and stops at retryable system failure", async () => {
  const f = setup();
  for (const id of ["a", "b", "c"]) await f.store.savePending(submission(id));
  const seen: string[] = [];
  const gateway: SurveySubmissionGateway = { submit: async (s) => {
    seen.push(s.submissionId);
    return s.submissionId === "a" ? { status: "REJECTED", reason: "INVALID_SUBMISSION" } : { status: "RETRYABLE_FAILURE", reason: "TEMPORARY_SERVER_FAILURE" };
  } };
  const sync = createSynchronizePendingSubmissions({ localSubmissionStore: f.store, submissionGateway: gateway });
  assert.deepEqual(await sync(), { status: "INTERRUPTED", reason: "TEMPORARY_SERVER_FAILURE", attempted: 2, synced: 0, rejected: 1, remainingPending: 2 });
  assert.deepEqual(seen, ["a", "b"]);
});

test("one synchronizer shares the in-flight promise and recovers after exception", async () => {
  const f = setup();
  await f.store.savePending(submission());
  let fail = true;
  const sync = createSynchronizePendingSubmissions({ localSubmissionStore: f.store, submissionGateway: { submit: async () => {
    if (fail) throw new Error("Unexpected adapter error");
    return { status: "ACCEPTED", acceptedAt: date(1500) };
  } } });
  const one = sync();
  assert.strictEqual(one, sync());
  await assert.rejects(one);
  fail = false;
  assert.equal((await sync()).synced, 1);
});

test("storage failure before transport prevents sending; failed acknowledgment remains retryable", async () => {
  const f = setup();
  let sent = false;
  await assert.rejects(submitSurvey({ ...f.client, localSubmissionStore: { ...f.store, savePending: async () => { throw new Error("Quota"); } }, submissionGateway: { submit: async () => { sent = true; return { status: "ACCEPTED", acceptedAt: date(1500) }; } } }, { survey, draft, now: date(1500) }));
  assert.equal(sent, false);
  await assert.rejects(submitSurvey({ ...f.client, localSubmissionStore: { ...f.store, markSynced: async () => { throw new Error("Storage unavailable"); } } }, { survey, draft, now: date(1500) }));
  assert.equal((await f.store.listPendingInQueueOrder()).length, 1);
  const sync = createSynchronizePendingSubmissions({ localSubmissionStore: f.store, submissionGateway: f.gateway });
  assert.equal((await sync()).synced, 1);
  assert.equal(f.accepted.size, 1);
});
