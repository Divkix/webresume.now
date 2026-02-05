import { describe, expect, it } from "vitest";
import { resetPasswordWithStrongSchema, signUpWithStrongPasswordSchema } from "@/lib/schemas/auth";

describe("auth schemas with password strength", () => {
  describe("signUpWithStrongPasswordSchema", () => {
    it("rejects extremely weak passwords", async () => {
      const result = await signUpWithStrongPasswordSchema.safeParseAsync({
        name: "John Doe",
        email: "john@example.com",
        password: "12345678", // Very weak
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod v4 uses .issues instead of .errors
        const passwordError = result.error.issues.find((e) => e.path.includes("password"));
        expect(passwordError).toBeDefined();
        expect(passwordError?.message).toContain("weak");
      }
    });

    it("rejects common passwords", async () => {
      const result = await signUpWithStrongPasswordSchema.safeParseAsync({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("accepts strong passwords", async () => {
      const result = await signUpWithStrongPasswordSchema.safeParseAsync({
        name: "John Doe",
        email: "john@example.com",
        password: "correct horse battery staple!",
      });

      expect(result.success).toBe(true);
    });

    it("still validates other fields", async () => {
      const result = await signUpWithStrongPasswordSchema.safeParseAsync({
        name: "",
        email: "invalid-email",
        password: "correct horse battery staple!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe("resetPasswordWithStrongSchema", () => {
    it("rejects weak new password", async () => {
      const result = await resetPasswordWithStrongSchema.safeParseAsync({
        newPassword: "password",
        confirmPassword: "password",
      });

      expect(result.success).toBe(false);
    });

    it("still validates password confirmation match", async () => {
      const result = await resetPasswordWithStrongSchema.safeParseAsync({
        newPassword: "correct horse battery staple!",
        confirmPassword: "different password entirely!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find((e) => e.path.includes("confirmPassword"));
        expect(confirmError?.message).toContain("match");
      }
    });

    it("accepts strong matching passwords", async () => {
      const strongPassword = "correct horse battery staple!";
      const result = await resetPasswordWithStrongSchema.safeParseAsync({
        newPassword: strongPassword,
        confirmPassword: strongPassword,
      });

      expect(result.success).toBe(true);
    });
  });
});
