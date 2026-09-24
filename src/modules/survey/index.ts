// src/modules/survey/index.ts
// Exposes explicit survey use cases, models, and contracts for external composition.
// Concrete adapters and internal helpers must not cross this entry point.

export {
  createSurvey,
  createSurveyId,
  createEventId,
  createLikertItemCode,
  createRespondentCategoryCode,
  SurveyDefinitionError,
} from "./domain/survey";
export type {
  Survey,
  SurveyId,
  EventId,
  LikertItemCode,
  LikertValue,
  RespondentCategoryCode,
  RespondentCategoryOption,
  LikertItem,
} from "./domain/survey";

export {
  createSurveySchedule,
  getSurveyAvailability,
  SurveyScheduleError,
} from "./domain/survey-schedule";
export type {
  SurveySchedule,
  SurveyAvailability,
} from "./domain/survey-schedule";

export {
  createSubmissionId,
  createSurveySubmission,
  SurveySubmissionError,
} from "./domain/survey-submission";
export type {
  SubmissionId,
  SurveySubmission,
  LikertAnswer,
  SurveySubmissionValidationError,
} from "./domain/survey-submission";
export type {
  SurveyDraft,
  SurveyDraftAnswer,
} from "./application/survey-draft";

export {
  getActiveSurvey,
} from "./application/get-active-survey/get-active-survey";
export type {
  GetActiveSurveyInput,
  GetActiveSurveyResult,
  GetActiveSurveyDependencies,
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
  SubmitSurveyInput,
  SubmitSurveyResult,
  SubmitSurveyDependencies,
  SubmitSurveyValidationError,
} from "./application/submit-survey/submit-survey";

export {
  acceptSurveySubmission,
} from "./application/accept-survey-submission/accept-survey-submission";
export type {
  AcceptSurveySubmissionInput,
  AcceptSurveySubmissionDependencies,
} from "./application/accept-survey-submission/accept-survey-submission";

export {
  createSynchronizePendingSubmissions,
} from "./application/synchronize-pending-submissions/synchronize-pending-submissions";
export type {
  SynchronizePendingSubmissions,
  SynchronizePendingSubmissionsDependencies,
  SynchronizePendingSubmissionsResult,
  SynchronizationSummary,
} from "./application/synchronize-pending-submissions/synchronize-pending-submissions";
export type {
  SurveyProvider,
  FindSurveyByEventResult,
} from "./ports/survey-provider.port";
export type {
  SurveySubmissionRepository,
  AcceptedSurveySubmissionRecord,
  SaveAcceptedSurveySubmissionResult,
} from "./ports/survey-submission-repository.port";
export type {
  SurveySubmissionGateway,
  SubmissionAcceptanceResult,
  SubmissionRejectionReason,
  SubmissionRetryableFailureReason,
} from "./ports/survey-submission-gateway.port";
export type {
  LocalSubmissionStore,
  LocalSubmissionRecord,
  PendingLocalSubmissionRecord,
  SubmissionSyncState,
} from "./ports/local-submission-store.port";
export type {
  SubmissionIdGenerator,
} from "./ports/submission-id-generator.port";
