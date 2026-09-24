// src/modules/survey/ports/submission-id-generator.port.ts
// Generates opaque identifiers for finalized survey submissions.

import type { SubmissionId } from "../domain/survey-submission";

export interface SubmissionIdGenerator {
  generate(): SubmissionId;
}
