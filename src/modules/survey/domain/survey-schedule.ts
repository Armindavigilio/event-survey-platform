// src/modules/survey/domain/survey-schedule.ts
// Defines survey scheduling rules and derives availability from configured timestamps.

export type SurveyAvailability = "UPCOMING" | "OPEN" | "SYNC_ONLY" | "CLOSED";

export interface SurveySchedule {
  readonly opensAt: Date;
  readonly closesAt: Date;
  readonly acceptSubmissionsUntil: Date;
}

export class SurveyScheduleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SurveyScheduleError";
  }
}

export function createSurveySchedule(input: {
  opensAt: Date;
  closesAt: Date;
  acceptSubmissionsUntil: Date;
}): SurveySchedule {
  const opensAt = copyValidDate(input.opensAt, "opensAt");
  const closesAt = copyValidDate(input.closesAt, "closesAt");
  const acceptSubmissionsUntil = copyValidDate(
    input.acceptSubmissionsUntil,
    "acceptSubmissionsUntil",
  );

  if (opensAt.getTime() >= closesAt.getTime()) {
    throw new SurveyScheduleError("opensAt must be earlier than closesAt.");
  }

  if (closesAt.getTime() > acceptSubmissionsUntil.getTime()) {
    throw new SurveyScheduleError(
      "closesAt must be earlier than or equal to acceptSubmissionsUntil.",
    );
  }

  return Object.freeze({
    opensAt,
    closesAt,
    acceptSubmissionsUntil,
  });
}

export function getSurveyAvailability(
  schedule: SurveySchedule,
  now: Date,
): SurveyAvailability {
  const currentTime = copyValidDate(now, "now").getTime();
  const opensAt = schedule.opensAt.getTime();
  const closesAt = schedule.closesAt.getTime();
  const acceptSubmissionsUntil = schedule.acceptSubmissionsUntil.getTime();

  if (currentTime < opensAt) {
    return "UPCOMING";
  }

  if (currentTime < closesAt) {
    return "OPEN";
  }

  if (currentTime <= acceptSubmissionsUntil) {
    return "SYNC_ONLY";
  }

  return "CLOSED";
}

function copyValidDate(value: Date, fieldName: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new SurveyScheduleError(`${fieldName} must be a valid Date.`);
  }

  return new Date(value.getTime());
}
