import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendVerificationEmail } from "@/lib/email/resend";

describe("email verification", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123456789");
    vi.stubEnv("BETTER_AUTH_URL", "https://clickfolio.me");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  describe("sendVerificationEmail", () => {
    it("sends verification email successfully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email_123" }),
      }) as unknown as typeof fetch;

      const result = await sendVerificationEmail({
        email: "test@example.com",
        verificationUrl: "https://clickfolio.me/api/auth/verify-email?token=abc123",
        userName: "Test User",
      });

      expect(result.success).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer re_test_123456789",
          }),
        }),
      );
    });

    it("includes user name in greeting when provided", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email_123" }),
      }) as unknown as typeof fetch;

      await sendVerificationEmail({
        email: "test@example.com",
        verificationUrl: "https://clickfolio.me/api/auth/verify-email?token=abc123",
        userName: "John Doe",
      });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall?.[1]?.body as string);
      expect(body.html).toContain("Hi John Doe");
      expect(body.text).toContain("Hi John Doe");
    });

    it("uses generic greeting when user name not provided", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email_123" }),
      }) as unknown as typeof fetch;

      await sendVerificationEmail({
        email: "test@example.com",
        verificationUrl: "https://clickfolio.me/api/auth/verify-email?token=abc123",
      });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall?.[1]?.body as string);
      expect(body.html).toContain("Hi,");
      expect(body.text).toContain("Hi,");
    });

    it("returns error when API key is missing", async () => {
      vi.stubEnv("RESEND_API_KEY", "");

      const result = await sendVerificationEmail({
        email: "test@example.com",
        verificationUrl: "https://clickfolio.me/api/auth/verify-email?token=abc123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("RESEND_API_KEY");
    });

    it("handles API errors gracefully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Rate limit exceeded" }),
      }) as unknown as typeof fetch;

      const result = await sendVerificationEmail({
        email: "test@example.com",
        verificationUrl: "https://clickfolio.me/api/auth/verify-email?token=abc123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Rate limit");
    });

    it("handles network errors gracefully", async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error")) as unknown as typeof fetch;

      const result = await sendVerificationEmail({
        email: "test@example.com",
        verificationUrl: "https://clickfolio.me/api/auth/verify-email?token=abc123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("escapes HTML in user name to prevent XSS", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email_123" }),
      }) as unknown as typeof fetch;

      await sendVerificationEmail({
        email: "test@example.com",
        verificationUrl: "https://clickfolio.me/api/auth/verify-email?token=abc123",
        userName: "<script>alert('xss')</script>",
      });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall?.[1]?.body as string);
      expect(body.html).not.toContain("<script>");
      expect(body.html).toContain("&lt;script&gt;");
    });
  });
});
