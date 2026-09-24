// src/modules/survey/ports/survey-submission-repository.port.ts
// Persists accepted submissions atomically while preserving submissionId uniqueness.

import type {
  SurveySubmission,
  SubmissionId,
} from "../domain/survey-submission";

export interface AcceptedSurveySubmissionRecord {
  readonly submission: SurveySubmission;
  readonly acceptedAt: Date;
}

export type SaveAcceptedSurveySubmissionResult =
  | {
      readonly status: "SAVED";
      readonly record: AcceptedSurveySubmissionRecord;
    }
  | {
      readonly status: "ALREADY_EXISTS";
      readonly record: AcceptedSurveySubmissionRecord;
    };

export interface SurveySubmissionRepository {
  findById(
    submissionId: SubmissionId,
  ): Promise<AcceptedSurveySubmissionRecord | null>;

  // Must atomically insert or return the existing record, never overwrite it.
  saveIfAbsent(
    record: AcceptedSurveySubmissionRecord,
  ): Promise<SaveAcceptedSurveySubmissionResult>;
}
