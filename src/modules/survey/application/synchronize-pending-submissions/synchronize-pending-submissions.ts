// src/modules/survey/application/synchronize-pending-submissions/synchronize-pending-submissions.ts
// Synchronizes queued submissions sequentially and stops only on retryable system-wide failure.

import type { LocalSubmissionStore } from "../../ports/local-submission-store.port";
import type {
  SubmissionRetryableFailureReason,
  SurveySubmissionGateway,
} from "../../ports/survey-submission-gateway.port";

export interface SynchronizePendingSubmissionsDependencies {
  readonly localSubmissionStore: LocalSubmissionStore;
  readonly submissionGateway: SurveySubmissionGateway;
}

export interface SynchronizationSummary {
  readonly attempted: number;
  readonly synced: number;
  readonly rejected: number;
  readonly remainingPending: number;
}

export type SynchronizePendingSubmissionsResult =
  | ({
      readonly status: "COMPLETED";
    } & SynchronizationSummary)
  | ({
      readonly status: "INTERRUPTED";
      readonly reason: SubmissionRetryableFailureReason;
    } & SynchronizationSummary);

export type SynchronizePendingSubmissions =
  () => Promise<SynchronizePendingSubmissionsResult>;

export function createSynchronizePendingSubmissions(
  dependencies: SynchronizePendingSubmissionsDependencies,
): SynchronizePendingSubmissions {
  let activeRun: Promise<SynchronizePendingSubmissionsResult> | null = null;

  return function synchronizePendingSubmissions() {
    if (activeRun !== null) {
      return activeRun;
    }

    activeRun = runSynchronization(dependencies).finally(() => {
      activeRun = null;
    });

    return activeRun;
  };
}

async function runSynchronization(
  dependencies: SynchronizePendingSubmissionsDependencies,
): Promise<SynchronizePendingSubmissionsResult> {
  const pendingSnapshot =
    await dependencies.localSubmissionStore.listPendingInQueueOrder();

  let attempted = 0;
  let synced = 0;
  let rejected = 0;

  for (const record of pendingSnapshot) {
    attempted += 1;

    const acceptance = await dependencies.submissionGateway.submit(
      record.submission,
    );

    switch (acceptance.status) {
      case "ACCEPTED":
      case "ALREADY_ACCEPTED":
        await dependencies.localSubmissionStore.markSynced(
          record.submission.submissionId,
          acceptance.acceptedAt,
        );
        synced += 1;
        break;

      case "REJECTED":
        await dependencies.localSubmissionStore.markRejected(
          record.submission.submissionId,
          acceptance.reason,
        );
        rejected += 1;
        break;

      case "RETRYABLE_FAILURE":
        return {
          status: "INTERRUPTED",
          reason: acceptance.reason,
          attempted,
          synced,
          rejected,
          remainingPending: await countRemainingPending(
            dependencies.localSubmissionStore,
          ),
        };
    }
  }

  return {
    status: "COMPLETED",
    attempted,
    synced,
    rejected,
    remainingPending: await countRemainingPending(
      dependencies.localSubmissionStore,
    ),
  };
}

async function countRemainingPending(
  localSubmissionStore: LocalSubmissionStore,
): Promise<number> {
  const pending =
    await localSubmissionStore.listPendingInQueueOrder();

  return pending.length;
}
