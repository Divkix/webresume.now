/**
 * Queue message types for Cloudflare Queues
 */

/**
 * Message for resume parsing queue
 */
export interface ResumeParseMessage {
  type: "parse";
  resumeId: string;
  userId: string;
  r2Key: string;
  fileHash: string;
  attempt: number;
}

/**
 * Union type for all queue messages
 */
export type QueueMessage = ResumeParseMessage;

/**
 * Dead letter queue message wrapper
 */
export interface DeadLetterMessage {
  originalMessage: QueueMessage;
  failureReason: string;
  failedAt: string;
  attempts: number;
}
