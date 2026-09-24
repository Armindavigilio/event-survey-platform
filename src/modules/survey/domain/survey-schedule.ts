// src/modules/survey/domain/survey-schedule.ts
// Defines immutable survey scheduling rules and derives availability from configured timestamps.

export type SurveyAvailability = "UPCOMING" | "OPEN" | "SYNC_ONLY" | "CLOSED";

export class SurveyScheduleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SurveyScheduleError";
  }
}

export class SurveySchedule {
  readonly #opensAtMs: number;
  readonly #closesAtMs: number;
  readonly #acceptSubmissionsUntilMs: number;

  private constructor(
    opensAtMs: number,
    closesAtMs: number,
    acceptSubmissionsUntilMs: number,
  ) {
    this.#opensAtMs = opensAtMs;
    this.#closesAtMs = closesAtMs;
    this.#acceptSubmissionsUntilMs = acceptSubmissionsUntilMs;
  }

  static create(input: {
    opensAt: Date;
    closesAt: Date;
    acceptSubmissionsUntil: Date;
  }): SurveySchedule {
    const opensAtMs = getValidTimestamp(input.opensAt, "opensAt");
    const closesAtMs = getValidTimestamp(input.closesAt, "closesAt");
    const acceptSubmissionsUntilMs = getValidTimestamp(
      input.acceptSubmissionsUntil,
      "acceptSubmissionsUntil",
    );

    if (opensAtMs >= closesAtMs) {
      throw new SurveyScheduleError("opensAt must be earlier than closesAt.");
    }

    if (closesAtMs > acceptSubmissionsUntilMs) {
      throw new SurveyScheduleError(
        "closesAt must be earlier than or equal to acceptSubmissionsUntil.",
      );
    }

    return new SurveySchedule(
      opensAtMs,
      closesAtMs,
      acceptSubmissionsUntilMs,
    );
  }

  get opensAt(): Date {
    return new Date(this.#opensAtMs);
  }

  get closesAt(): Date {
    return new Date(this.#closesAtMs);
  }

  get acceptSubmissionsUntil(): Date {
    return new Date(this.#acceptSubmissionsUntilMs);
  }

  availabilityAt(now: Date): SurveyAvailability {
    const nowMs = getValidTimestamp(now, "now");

    if (nowMs < this.#opensAtMs) {
      return "UPCOMING";
    }

    if (nowMs < this.#closesAtMs) {
      return "OPEN";
    }

    if (nowMs <= this.#acceptSubmissionsUntilMs) {
      return "SYNC_ONLY";
    }

    return "CLOSED";
  }
}

export function createSurveySchedule(input: {
  opensAt: Date;
  closesAt: Date;
  acceptSubmissionsUntil: Date;
}): SurveySchedule {
  return SurveySchedule.create(input);
}

export function getSurveyAvailability(
  schedule: SurveySchedule,
  now: Date,
): SurveyAvailability {
  return schedule.availabilityAt(now);
}

function getValidTimestamp(value: Date, fieldName: string): number {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new SurveyScheduleError(`${fieldName} must be a valid Date.`);
  }

  return value.getTime();
}
