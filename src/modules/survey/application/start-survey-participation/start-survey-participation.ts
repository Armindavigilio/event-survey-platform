// src/modules/survey/application/start-survey-participation/start-survey-participation.ts
// Starts a new editable survey draft only when the survey is currently open.

import type { Survey } from "../../domain/survey";
import {
  getSurveyAvailability,
  type SurveyAvailability,
} from "../../domain/survey-schedule";
import {
  createEmptySurveyDraft,
  type SurveyDraft,
} from "../survey-draft";

export interface StartSurveyParticipationInput {
  readonly survey: Survey;
  readonly now: Date;
}

export type StartSurveyParticipationResult =
  | {
      readonly status: "STARTED";
      readonly draft: SurveyDraft;
    }
  | {
      readonly status: "SURVEY_NOT_OPEN";
      readonly availability: Exclude<SurveyAvailability, "OPEN">;
    };

export function startSurveyParticipation(
  input: StartSurveyParticipationInput,
): StartSurveyParticipationResult {
  const availability = getSurveyAvailability(input.survey.schedule, input.now);

  if (availability !== "OPEN") {
    return {
      status: "SURVEY_NOT_OPEN",
      availability,
    };
  }

  return {
    status: "STARTED",
    draft: createEmptySurveyDraft(input.survey.id),
  };
}
