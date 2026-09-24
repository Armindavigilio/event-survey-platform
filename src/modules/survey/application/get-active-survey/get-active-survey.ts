// src/modules/survey/application/get-active-survey/get-active-survey.ts
// Retrieves the survey configured for an event and derives its current server-side availability.

import {
  getSurveyAvailability,
  type SurveyAvailability,
} from "../../domain/survey-schedule";
import type { EventId, Survey } from "../../domain/survey";
import type { SurveyProvider } from "../../ports/survey-provider.port";

export interface GetActiveSurveyInput {
  readonly eventId: EventId;
  readonly now: Date;
}

export type GetActiveSurveyResult =
  | {
      readonly status: "FOUND";
      readonly survey: Survey;
      readonly availability: SurveyAvailability;
    }
  | {
      readonly status: "EVENT_NOT_FOUND";
    }
  | {
      readonly status: "SURVEY_NOT_CONFIGURED";
    };

export interface GetActiveSurveyDependencies {
  readonly surveyProvider: SurveyProvider;
}

export async function getActiveSurvey(
  dependencies: GetActiveSurveyDependencies,
  input: GetActiveSurveyInput,
): Promise<GetActiveSurveyResult> {
  const lookup = await dependencies.surveyProvider.findByEventId(input.eventId);

  if (lookup.status !== "FOUND") {
    return lookup;
  }

  return {
    status: "FOUND",
    survey: lookup.survey,
    availability: getSurveyAvailability(lookup.survey.schedule, input.now),
  };
}
