// src/modules/survey/ports/local-submission-store.port.ts
// Stores offline submissions and exposes pending records in deterministic queue order.

import type { SubmissionId, SurveySubmission } from "../domain/survey-submission";
import type { SubmissionRejectionReason } from "./survey-submission-gateway.port";

export type SubmissionSyncState = "PENDING" | "SYNCED" | "REJECTED";

export type LocalSubmissionRecord =
  | {
      readonly submission: SurveySubmission;
      readonly syncState: "PENDING";
    }
  | {
      readonly submission: SurveySubmission;
      readonly syncState: "SYNCED";
      readonly acceptedAt: Date;
    }
  | {
      readonly submission: SurveySubmission;
      readonly syncState: "REJECTED";
      readonly reason: SubmissionRejectionReason;
    };

export type PendingLocalSubmissionRecord = Extract<
  LocalSubmissionRecord,
  { syncState: "PENDING" }
>;

export interface LocalSubmissionStore {
  // Must durably insert without overwriting another participation or resetting terminal state.
  // Storage failures reject the promise: a caller must never claim offline safety before this resolves.
  savePending(submission: SurveySubmission): Promise<void>;

  /**
   * Returns a snapshot of pending submissions in queue order:
   * oldest enqueued submission first.
   */
  listPendingInQueueOrder(): Promise<
    readonly PendingLocalSubmissionRecord[]
  >;

  markSynced(
    submissionId: SubmissionId,
    acceptedAt: Date,
  ): Promise<void>;

  markRejected(
    submissionId: SubmissionId,
    reason: SubmissionRejectionReason,
  ): Promise<void>;
}
