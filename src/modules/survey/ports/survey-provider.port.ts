// src/modules/survey/ports/survey-provider.port.ts
// Provides survey definitions while preserving event/survey lookup outcomes needed by use cases.

import type { EventId, Survey, SurveyId } from "../domain/survey";

export type FindSurveyByEventResult =
  | {
      readonly status: "FOUND";
      readonly survey: Survey;
    }
  | {
      readonly status: "EVENT_NOT_FOUND";
    }
  | {
      readonly status: "SURVEY_NOT_CONFIGURED";
    };

export interface SurveyProvider {
  findByEventId(eventId: EventId): Promise<FindSurveyByEventResult>;
  findById(surveyId: SurveyId): Promise<Survey | null>;
}
