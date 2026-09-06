import { describe, expect, it } from "vite-plus/test";
import {
  type DeadLetterMessage,
  type QueueMessage,
  queueMessageSchema,
  type ResumeParseMessage,
} from "@/lib/queue/types";

describe("Queue Types", () => {
  describe("queueMessageSchema - valid messages", () => {
    it("should accept a valid parse message", () => {
      const message = {
        type: "parse",
        resumeId: "resume-123",
        userId: "user-456",
        r2Key: "uploads/resume.pdf",
        fileHash: "sha256-abc123",
        attempt: 1,
      };

      const result = queueMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });
  });

  describe("queueMessageSchema - invalid messages", () => {
    it("should reject a message with missing type", () => {
      const message = {
        resumeId: "resume-123",
        userId: "user-456",
        r2Key: "uploads/resume.pdf",
        fileHash: "sha256-abc123",
        attempt: 1,
      };

      const result = queueMessageSchema.safeParse(message);
      expect(result.success).toBe(false);
    });

    it("should reject empty object", () => {
      const result = queueMessageSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = queueMessageSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject array", () => {
      const result = queueMessageSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it("should reject string", () => {
      const result = queueMessageSchema.safeParse("parse");
      expect(result.success).toBe(false);
    });
  });

  describe("queueMessageSchema - parsing success", () => {
    it("should return correct parsed data on success", () => {
      const message = {
        type: "parse",
        resumeId: "resume-123",
        userId: "user-456",
        r2Key: "uploads/resume.pdf",
        fileHash: "sha256-abc123",
        attempt: 2,
      };

      const result = queueMessageSchema.parse(message);
      expect(result).toEqual(message);
    });
  });

  describe("ResumeParseMessage type", () => {
    it("should satisfy type constraints", () => {
      const message: ResumeParseMessage = {
        type: "parse",
        resumeId: "resume-123",
        userId: "user-456",
        r2Key: "uploads/resume.pdf",
        fileHash: "sha256-abc123",
        attempt: 1,
      };

      expect(message.type).toBe("parse");
      expect(message.attempt).toBe(1);
    });
  });

  describe("QueueMessage union type", () => {
    it("should accept ResumeParseMessage", () => {
      const message: QueueMessage = {
        type: "parse",
        resumeId: "resume-123",
        userId: "user-456",
        r2Key: "uploads/resume.pdf",
        fileHash: "sha256-abc123",
        attempt: 1,
      };

      expect(message.type).toBe("parse");
    });
  });

  describe("DeadLetterMessage interface", () => {
    it("should accept valid dead letter structure", () => {
      const dlqMessage: DeadLetterMessage = {
        originalMessage: {
          type: "parse",
          resumeId: "resume-123",
          userId: "user-456",
          r2Key: "uploads/resume.pdf",
          fileHash: "sha256-abc123",
          attempt: 3,
        },
        failureReason: "Max retries exceeded",
        failedAt: "2026-01-15T12:00:00.000Z",
        attempts: 3,
      };

      expect(dlqMessage.originalMessage.resumeId).toBe("resume-123");
      expect(dlqMessage.failureReason).toBe("Max retries exceeded");
      expect(dlqMessage.attempts).toBe(3);
    });
  });
});
