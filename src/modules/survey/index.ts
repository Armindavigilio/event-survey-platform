// src/modules/survey/index.ts
// Exposes the stable public API used by delivery/composition code and other modules.
// Internal ports, adapter details, domain errors, and helper factories stay private.

export {
  createEventId,
  createLikertItemCode,
  createRespondentCategoryCode,
  createSurveyId,
} from "./domain/survey";
export type {
  EventId,
  LikertItem,
  LikertItemCode,
  LikertValue,
  RespondentCategoryCode,
  RespondentCategoryOption,
  Survey,
  SurveyId,
} from "./domain/survey";

export type {
  SurveyAvailability,
  SurveySchedule,
} from "./domain/survey-schedule";

export {
  createSubmissionId,
} from "./domain/survey-submission";
export type {
  LikertAnswer,
  SubmissionId,
  SurveySubmission,
} from "./domain/survey-submission";

export type {
  SurveyDraft,
  SurveyDraftAnswer,
} from "./application/survey-draft";

export {
  getActiveSurvey,
} from "./application/get-active-survey/get-active-survey";
export type {
  GetActiveSurveyDependencies,
  GetActiveSurveyInput,
  GetActiveSurveyResult,
} from "./application/get-active-survey/get-active-survey";

export {
  startSurveyParticipation,
} from "./application/start-survey-participation/start-survey-participation";
export type {
  StartSurveyParticipationInput,
  StartSurveyParticipationResult,
} from "./application/start-survey-participation/start-survey-participation";

export {
  submitSurvey,
} from "./application/submit-survey/submit-survey";
export type {
  SubmitSurveyDependencies,
  SubmitSurveyInput,
  SubmitSurveyResult,
  SubmitSurveyValidationError,
} from "./application/submit-survey/submit-survey";

export {
  acceptSurveySubmission,
} from "./application/accept-survey-submission/accept-survey-submission";
export type {
  AcceptSurveySubmissionDependencies,
  AcceptSurveySubmissionInput,
} from "./application/accept-survey-submission/accept-survey-submission";

export {
  createSynchronizePendingSubmissions,
} from "./application/synchronize-pending-submissions/synchronize-pending-submissions";
export type {
  SynchronizationSummary,
  SynchronizePendingSubmissions,
  SynchronizePendingSubmissionsDependencies,
  SynchronizePendingSubmissionsResult,
} from "./application/synchronize-pending-submissions/synchronize-pending-submissions";

export type {
  SubmissionAcceptanceResult,
  SubmissionRejectionReason,
  SubmissionRetryableFailureReason,
} from "./ports/survey-submission-gateway.port";
