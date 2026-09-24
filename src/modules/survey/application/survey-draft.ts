// src/modules/survey/application/survey-draft.ts
// Represents the editable, incomplete state of a survey participation before final submission.

import type {
  LikertItemCode,
  LikertValue,
  RespondentCategoryCode,
  SurveyId,
} from "../domain/survey";

export interface SurveyDraftAnswer {
  readonly itemCode: LikertItemCode;
  readonly value: LikertValue;
}

export interface SurveyDraft {
  readonly surveyId: SurveyId;
  readonly respondentCategoryCode?: RespondentCategoryCode;
  readonly answers: readonly SurveyDraftAnswer[];
}

export function createEmptySurveyDraft(surveyId: SurveyId): SurveyDraft {
  return Object.freeze({
    surveyId,
    answers: Object.freeze([]),
  });
}
