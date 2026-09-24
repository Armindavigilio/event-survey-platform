// src/modules/survey/application/submit-survey/submit-survey.ts
// Finalizes a valid draft, persists it locally, and attempts authoritative submission.

import type { Survey } from "../../domain/survey";
import {
  getSurveyAvailability,
  type SurveyAvailability,
} from "../../domain/survey-schedule";
import {
  createSurveySubmission,
  validateSurveySubmissionContent,
  type SubmissionId,
  type SurveySubmissionValidationError,
} from "../../domain/survey-submission";
import type { LocalSubmissionStore } from "../../ports/local-submission-store.port";
import type { SubmissionIdGenerator } from "../../ports/submission-id-generator.port";
import type {
  SubmissionRejectionReason,
  SubmissionRetryableFailureReason,
  SurveySubmissionGateway,
} from "../../ports/survey-submission-gateway.port";
import type { SurveyDraft } from "../survey-draft";

export interface SubmitSurveyDependencies {
  readonly submissionIdGenerator: SubmissionIdGenerator;
  readonly submissionGateway: SurveySubmissionGateway;
  readonly localSubmissionStore: LocalSubmissionStore;
}

export interface SubmitSurveyInput {
  readonly survey: Survey;
  readonly draft: SurveyDraft;
  readonly now: Date;
}

export type SubmitSurveyValidationError =
  | {
      readonly code: "SURVEY_MISMATCH";
    }
  | SurveySubmissionValidationError;

export type SubmitSurveyResult =
  | {
      readonly status: "INVALID_DRAFT";
      readonly error: SubmitSurveyValidationError;
    }
  | {
      readonly status: "SURVEY_NOT_OPEN";
      readonly availability: Exclude<SurveyAvailability, "OPEN">;
    }
  | {
      readonly status: "SYNCED";
      readonly submissionId: SubmissionId;
      readonly acceptedAt: Date;
    }
  | {
      readonly status: "PENDING";
      readonly submissionId: SubmissionId;
      readonly reason: SubmissionRetryableFailureReason;
    }
  | {
      readonly status: "REJECTED";
      readonly submissionId: SubmissionId;
      readonly reason: SubmissionRejectionReason;
    };

export async function submitSurvey(
  dependencies: SubmitSurveyDependencies,
  input: SubmitSurveyInput,
): Promise<SubmitSurveyResult> {
  const availability = getSurveyAvailability(input.survey.schedule, input.now);

  if (availability !== "OPEN") {
    return {
      status: "SURVEY_NOT_OPEN",
      availability,
    };
  }

  if (input.draft.surveyId !== input.survey.id) {
    return {
      status: "INVALID_DRAFT",
      error: {
        code: "SURVEY_MISMATCH",
      },
    };
  }

  const validation = validateSurveySubmissionContent({
    survey: input.survey,
    respondentCategoryCode: input.draft.respondentCategoryCode,
    answers: input.draft.answers,
  });

  if (validation.status === "INVALID") {
    return {
      status: "INVALID_DRAFT",
      error: validation.error,
    };
  }

  const submissionId = dependencies.submissionIdGenerator.generate();

  const submission = createSurveySubmission({
    submissionId,
    survey: input.survey,
    respondentCategoryCode: validation.respondentCategoryCode,
    answers: validation.answers,
  });

  // Persist first so a finalized response survives a transport failure or page exit.
  await dependencies.localSubmissionStore.savePending(submission);

  const acceptance = await dependencies.submissionGateway.submit(submission);

  switch (acceptance.status) {
    case "ACCEPTED":
    case "ALREADY_ACCEPTED":
      await dependencies.localSubmissionStore.markSynced(
        submissionId,
        acceptance.acceptedAt,
      );

      return {
        status: "SYNCED",
        submissionId,
        acceptedAt: acceptance.acceptedAt,
      };

    case "RETRYABLE_FAILURE":
      return {
        status: "PENDING",
        submissionId,
        reason: acceptance.reason,
      };

    case "REJECTED":
      await dependencies.localSubmissionStore.markRejected(
        submissionId,
        acceptance.reason,
      );

      return {
        status: "REJECTED",
        submissionId,
        reason: acceptance.reason,
      };
  }
}
