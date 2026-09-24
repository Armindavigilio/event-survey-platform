// src/modules/survey/domain/survey-submission.ts
// Defines immutable completed survey submissions and validates their content against a survey.

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

export type SurveySubmissionValidationError =
  | {
      readonly code: "MISSING_RESPONDENT_CATEGORY";
    }
  | {
      readonly code: "INVALID_RESPONDENT_CATEGORY";
      readonly categoryCode: RespondentCategoryCode;
    }
  | {
      readonly code: "DUPLICATE_ANSWER";
      readonly itemCode: LikertItemCode;
    }
  | {
      readonly code: "UNKNOWN_ITEM";
      readonly itemCode: LikertItemCode;
    }
  | {
      readonly code: "INVALID_LIKERT_VALUE";
      readonly itemCode: LikertItemCode;
      readonly value: number;
    }
  | {
      readonly code: "MISSING_ANSWERS";
      readonly itemCodes: readonly LikertItemCode[];
    };

export type SurveySubmissionContentValidationResult =
  | {
      readonly status: "VALID";
      readonly respondentCategoryCode: RespondentCategoryCode;
      readonly answers: readonly LikertAnswer[];
    }
  | {
      readonly status: "INVALID";
      readonly error: SurveySubmissionValidationError;
    };

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

export function validateSurveySubmissionContent(input: {
  survey: Survey;
  respondentCategoryCode?: RespondentCategoryCode;
  answers: readonly {
    itemCode: LikertItemCode;
    value: number;
  }[];
}): SurveySubmissionContentValidationResult {
  if (input.respondentCategoryCode === undefined) {
    return {
      status: "INVALID",
      error: {
        code: "MISSING_RESPONDENT_CATEGORY",
      },
    };
  }

  const categoryExists = input.survey.respondentCategories.some(
    (category) => category.code === input.respondentCategoryCode,
  );

  if (!categoryExists) {
    return {
      status: "INVALID",
      error: {
        code: "INVALID_RESPONDENT_CATEGORY",
        categoryCode: input.respondentCategoryCode,
      },
    };
  }

  const surveyItemCodes = new Set(input.survey.items.map((item) => item.code));
  const answerItemCodes = new Set<LikertItemCode>();
  const validatedAnswers: LikertAnswer[] = [];

  for (const answer of input.answers) {
    if (answerItemCodes.has(answer.itemCode)) {
      return {
        status: "INVALID",
        error: {
          code: "DUPLICATE_ANSWER",
          itemCode: answer.itemCode,
        },
      };
    }

    if (!surveyItemCodes.has(answer.itemCode)) {
      return {
        status: "INVALID",
        error: {
          code: "UNKNOWN_ITEM",
          itemCode: answer.itemCode,
        },
      };
    }

    if (!isLikertValue(answer.value)) {
      return {
        status: "INVALID",
        error: {
          code: "INVALID_LIKERT_VALUE",
          itemCode: answer.itemCode,
          value: answer.value,
        },
      };
    }

    answerItemCodes.add(answer.itemCode);
    validatedAnswers.push({
      itemCode: answer.itemCode,
      value: answer.value,
    });
  }

  const missingItemCodes = input.survey.items
    .map((item) => item.code)
    .filter((itemCode) => !answerItemCodes.has(itemCode));

  if (missingItemCodes.length > 0) {
    return {
      status: "INVALID",
      error: {
        code: "MISSING_ANSWERS",
        itemCodes: Object.freeze(missingItemCodes),
      },
    };
  }

  return {
    status: "VALID",
    respondentCategoryCode: input.respondentCategoryCode,
    answers: Object.freeze(
      validatedAnswers.map((answer) => Object.freeze({ ...answer })),
    ),
  };
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
  const validation = validateSurveySubmissionContent({
    survey: input.survey,
    respondentCategoryCode: input.respondentCategoryCode,
    answers: input.answers,
  });

  if (validation.status === "INVALID") {
    throw new SurveySubmissionError(
      describeValidationError(validation.error),
    );
  }

  return Object.freeze({
    submissionId: input.submissionId,
    surveyId: input.survey.id,
    respondentCategoryCode: validation.respondentCategoryCode,
    answers: validation.answers,
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

function describeValidationError(
  error: SurveySubmissionValidationError,
): string {
  switch (error.code) {
    case "MISSING_RESPONDENT_CATEGORY":
      return "Respondent category is required.";

    case "INVALID_RESPONDENT_CATEGORY":
      return `Respondent category "${error.categoryCode}" is not defined by the survey.`;

    case "DUPLICATE_ANSWER":
      return `Duplicate answer for item "${error.itemCode}".`;

    case "UNKNOWN_ITEM":
      return `Unknown survey item "${error.itemCode}".`;

    case "INVALID_LIKERT_VALUE":
      return `Likert value for item "${error.itemCode}" must be an integer from 1 to 7.`;

    case "MISSING_ANSWERS":
      return "Submission must contain exactly one answer for every survey item.";
  }
}
