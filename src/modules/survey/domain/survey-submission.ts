// src/modules/survey/domain/survey-submission.ts
// Defines an immutable completed survey participation and validates it against its survey.

import {
  isLikertValue,
  type LikertItemCode,
  type LikertValue,
  type RespondentCategoryCode,
  type Survey,
  type SurveyId,
} from "./survey";

declare const submissionIdBrand: unique symbol;

export type SubmissionId = string & {
  readonly [submissionIdBrand]: "SubmissionId";
};

export interface LikertAnswer {
  readonly itemCode: LikertItemCode;
  readonly value: LikertValue;
}

export interface SurveySubmission {
  readonly submissionId: SubmissionId;
  readonly surveyId: SurveyId;
  readonly respondentCategoryCode: RespondentCategoryCode;
  readonly answers: readonly LikertAnswer[];
}

export class SurveySubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SurveySubmissionError";
  }
}

export function createSubmissionId(value: string): SubmissionId {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new SurveySubmissionError("SubmissionId cannot be empty.");
  }

  return normalized as SubmissionId;
}

export function createSurveySubmission(input: {
  submissionId: SubmissionId;
  survey: Survey;
  respondentCategoryCode: RespondentCategoryCode;
  answers: readonly {
    itemCode: LikertItemCode;
    value: number;
  }[];
}): SurveySubmission {
  assertValidRespondentCategory(input.survey, input.respondentCategoryCode);
  assertValidAnswers(input.survey, input.answers);

  const answers = Object.freeze(
    input.answers.map((answer) =>
      Object.freeze({
        itemCode: answer.itemCode,
        value: answer.value as LikertValue,
      }),
    ),
  );

  return Object.freeze({
    submissionId: input.submissionId,
    surveyId: input.survey.id,
    respondentCategoryCode: input.respondentCategoryCode,
    answers,
  });
}

export function hasSameSubmissionContent(
  left: SurveySubmission,
  right: SurveySubmission,
): boolean {
  if (
    left.surveyId !== right.surveyId ||
    left.respondentCategoryCode !== right.respondentCategoryCode ||
    left.answers.length !== right.answers.length
  ) {
    return false;
  }

  const rightAnswers = new Map(
    right.answers.map((answer) => [answer.itemCode, answer.value]),
  );

  return left.answers.every(
    (answer) => rightAnswers.get(answer.itemCode) === answer.value,
  );
}

function assertValidRespondentCategory(
  survey: Survey,
  categoryCode: RespondentCategoryCode,
): void {
  const exists = survey.respondentCategories.some(
    (category) => category.code === categoryCode,
  );

  if (!exists) {
    throw new SurveySubmissionError(
      "Respondent category is not defined by the survey.",
    );
  }
}

function assertValidAnswers(
  survey: Survey,
  answers: readonly {
    itemCode: LikertItemCode;
    value: number;
  }[],
): void {
  const surveyItemCodes = new Set(survey.items.map((item) => item.code));
  const answerItemCodes = new Set<LikertItemCode>();

  for (const answer of answers) {
    if (answerItemCodes.has(answer.itemCode)) {
      throw new SurveySubmissionError(
        `Duplicate answer for item "${answer.itemCode}".`,
      );
    }

    if (!surveyItemCodes.has(answer.itemCode)) {
      throw new SurveySubmissionError(
        `Unknown survey item "${answer.itemCode}".`,
      );
    }

    if (!isLikertValue(answer.value)) {
      throw new SurveySubmissionError(
        `Likert value for item "${answer.itemCode}" must be an integer from 1 to 7.`,
      );
    }

    answerItemCodes.add(answer.itemCode);
  }

  if (answerItemCodes.size !== surveyItemCodes.size) {
    throw new SurveySubmissionError(
      "Submission must contain exactly one answer for every survey item.",
    );
  }
}
