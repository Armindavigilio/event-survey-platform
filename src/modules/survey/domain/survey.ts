// src/modules/survey/domain/survey.ts
// Defines the survey model, Likert items, respondent categories, and definition invariants.

import type { SurveySchedule } from "./survey-schedule";

declare const surveyIdBrand: unique symbol;
declare const eventIdBrand: unique symbol;
declare const likertItemCodeBrand: unique symbol;
declare const respondentCategoryCodeBrand: unique symbol;

export type SurveyId = string & { readonly [surveyIdBrand]: "SurveyId" };
export type EventId = string & { readonly [eventIdBrand]: "EventId" };
export type LikertItemCode = string & {
  readonly [likertItemCodeBrand]: "LikertItemCode";
};
export type RespondentCategoryCode = string & {
  readonly [respondentCategoryCodeBrand]: "RespondentCategoryCode";
};

export type LikertValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RespondentCategoryOption {
  readonly code: RespondentCategoryCode;
  readonly label: string;
}

export interface LikertItem {
  readonly code: LikertItemCode;
  readonly dimension: string;
  readonly statement: string;
  readonly order: number;
}

export interface Survey {
  readonly id: SurveyId;
  readonly eventId: EventId;
  readonly title: string;
  readonly instructions: string;
  readonly schedule: SurveySchedule;
  readonly respondentCategories: readonly RespondentCategoryOption[];
  readonly items: readonly LikertItem[];
}

export class SurveyDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SurveyDefinitionError";
  }
}

export function createSurveyId(value: string): SurveyId {
  return requireNonEmptyString(value, "SurveyId") as SurveyId;
}

export function createEventId(value: string): EventId {
  return requireNonEmptyString(value, "EventId") as EventId;
}

export function createLikertItemCode(value: string): LikertItemCode {
  return requireNonEmptyString(value, "LikertItemCode") as LikertItemCode;
}

export function createRespondentCategoryCode(
  value: string,
): RespondentCategoryCode {
  return requireNonEmptyString(
    value,
    "RespondentCategoryCode",
  ) as RespondentCategoryCode;
}

export function isLikertValue(value: number): value is LikertValue {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

export function createSurvey(input: {
  id: SurveyId;
  eventId: EventId;
  title: string;
  instructions: string;
  schedule: SurveySchedule;
  respondentCategories: readonly RespondentCategoryOption[];
  items: readonly LikertItem[];
}): Survey {
  assertUniqueCodes(
    input.respondentCategories.map((category) => category.code),
    "respondent category",
  );

  assertUniqueCodes(
    input.items.map((item) => item.code),
    "Likert item",
  );

  const respondentCategories = Object.freeze(
    input.respondentCategories.map((category) =>
      Object.freeze({
        code: category.code,
        label: category.label,
      }),
    ),
  );

  const items = Object.freeze(
    input.items.map((item) =>
      Object.freeze({
        code: item.code,
        dimension: item.dimension,
        statement: item.statement,
        order: item.order,
      }),
    ),
  );

  return Object.freeze({
    id: input.id,
    eventId: input.eventId,
    title: input.title,
    instructions: input.instructions,
    schedule: input.schedule,
    respondentCategories,
    items,
  });
}

function requireNonEmptyString(value: string, typeName: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new SurveyDefinitionError(`${typeName} cannot be empty.`);
  }

  return normalized;
}

function assertUniqueCodes(
  codes: readonly string[],
  conceptName: string,
): void {
  const uniqueCodes = new Set(codes);

  if (uniqueCodes.size !== codes.length) {
    throw new SurveyDefinitionError(
      `Survey contains duplicated ${conceptName} codes.`,
    );
  }
}
