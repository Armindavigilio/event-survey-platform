// src/modules/survey/ports/survey-submission-gateway.port.ts
// Sends completed submissions to the authoritative server using application-level outcomes.

import type {
  SurveySubmission,
} from "../domain/survey-submission";

export type SubmissionRejectionReason =
  | "INVALID_SUBMISSION"
  | "UNKNOWN_SURVEY"
  | "SURVEY_NOT_OPEN"
  | "SURVEY_CLOSED"
  | "SUBMISSION_CONFLICT";

export type SubmissionRetryableFailureReason =
  | "TRANSPORT_UNAVAILABLE"
  | "TEMPORARY_SERVER_FAILURE";

export type SubmissionAcceptanceResult =
  | {
      readonly status: "ACCEPTED";
      readonly acceptedAt: Date;
    }
  | {
      readonly status: "ALREADY_ACCEPTED";
      readonly acceptedAt: Date;
    }
  | {
      readonly status: "REJECTED";
      readonly reason: SubmissionRejectionReason;
    }
  | {
      readonly status: "RETRYABLE_FAILURE";
      readonly reason: SubmissionRetryableFailureReason;
    };

export interface SurveySubmissionGateway {
  // Adapters return RETRYABLE_FAILURE for expected network/server failures.
  // Unexpected programming errors may reject the promise; callers must not report success.
  submit(
    submission: SurveySubmission,
  ): Promise<SubmissionAcceptanceResult>;
}
