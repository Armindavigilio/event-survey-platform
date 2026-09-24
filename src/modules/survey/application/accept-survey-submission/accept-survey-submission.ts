// src/modules/survey/application/accept-survey-submission/accept-survey-submission.ts
// Authoritatively validates, accepts, and idempotently persists a completed survey submission.

import type {
  LikertItemCode,
  RespondentCategoryCode,
  SurveyId,
} from "../../domain/survey";
import { getSurveyAvailability } from "../../domain/survey-schedule";
import {
  createSurveySubmission,
  hasSameSubmissionContent,
  type SubmissionId,
} from "../../domain/survey-submission";
import type { SurveyProvider } from "../../ports/survey-provider.port";
import type {
  SubmissionAcceptanceResult,
  SubmissionRejectionReason,
} from "../../ports/survey-submission-gateway.port";
import type { SurveySubmissionRepository } from "../../ports/survey-submission-repository.port";

export interface AcceptSurveySubmissionDependencies {
  readonly surveyProvider: SurveyProvider;
  readonly submissionRepository: SurveySubmissionRepository;
}

export interface AcceptSurveySubmissionInput {
  readonly submissionId: SubmissionId;
  readonly surveyId: SurveyId;
  readonly respondentCategoryCode?: RespondentCategoryCode;
  readonly answers: readonly {
    readonly itemCode: LikertItemCode;
    readonly value: number;
  }[];
  readonly now: Date;
}

export async function acceptSurveySubmission(
  dependencies: AcceptSurveySubmissionDependencies,
  input: AcceptSurveySubmissionInput,
): Promise<SubmissionAcceptanceResult> {
  const survey = await dependencies.surveyProvider.findById(input.surveyId);

  if (survey === null) {
    return rejected("UNKNOWN_SURVEY");
  }

  let submission;

  try {
    submission = createSurveySubmission({
      submissionId: input.submissionId,
      survey,
      respondentCategoryCode: requireCategory(input.respondentCategoryCode),
      answers: input.answers,
    });
  } catch {
    return rejected("INVALID_SUBMISSION");
  }

  // Acknowledging an existing response must still work after the acceptance window.
  const existing = await dependencies.submissionRepository.findById(
    input.submissionId,
  );
  if (existing !== null) {
    return hasSameSubmissionContent(existing.submission, submission)
      ? {
          status: "ALREADY_ACCEPTED",
          acceptedAt: new Date(existing.acceptedAt.getTime()),
        }
      : rejected("SUBMISSION_CONFLICT");
  }

  const availability = getSurveyAvailability(survey.schedule, input.now);

  if (availability === "UPCOMING") {
    return rejected("SURVEY_NOT_OPEN");
  }

  if (availability === "CLOSED") {
    return rejected("SURVEY_CLOSED");
  }

  const acceptedAt = new Date(input.now.getTime());

  const persistenceResult =
    await dependencies.submissionRepository.saveIfAbsent({
      submission,
      acceptedAt,
    });

  if (persistenceResult.status === "SAVED") {
    return {
      status: "ACCEPTED",
      acceptedAt: new Date(persistenceResult.record.acceptedAt.getTime()),
    };
  }

  if (
    hasSameSubmissionContent(
      persistenceResult.record.submission,
      submission,
    )
  ) {
    return {
      status: "ALREADY_ACCEPTED",
      acceptedAt: new Date(persistenceResult.record.acceptedAt.getTime()),
    };
  }

  return rejected("SUBMISSION_CONFLICT");
}

function requireCategory(
  categoryCode: RespondentCategoryCode | undefined,
): RespondentCategoryCode {
  if (categoryCode === undefined) {
    throw new Error("Respondent category is required.");
  }

  return categoryCode;
}

function rejected(
  reason: SubmissionRejectionReason,
): SubmissionAcceptanceResult {
  return {
    status: "REJECTED",
    reason,
  };
}
