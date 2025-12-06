/**
 * Environment variable validation
 * Validates required env vars at startup to fail fast
 */

interface EnvVar {
  key: string;
  value: string | undefined;
  required: boolean;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentError";
  }
}

/**
 * Gets a required environment variable
 * Throws error if not set
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new EnvironmentError(
      `Missing required environment variable: ${key}\n` +
        `Please set it in your .env file or deployment environment.`,
    );
  }
  return value;
}

/**
 * Gets an optional environment variable, returns undefined if not set
 */
function getEnvVar(key: string, required: boolean = true): string | undefined {
  const value = process.env[key];
  if (required && (!value || value.trim() === "")) {
    throw new EnvironmentError(
      `Missing required environment variable: ${key}\n` +
        `Please set it in your .env file or deployment environment.`,
    );
  }
  return value || undefined;
}

/**
 * Validates all required environment variables
 * Call this at app startup to fail fast
 */
export function validateEnvironment(): void {
  const requiredVars: EnvVar[] = [
    // Better Auth
    {
      key: "BETTER_AUTH_SECRET",
      value: process.env.BETTER_AUTH_SECRET,
      required: true,
    },
    {
      key: "BETTER_AUTH_URL",
      value: process.env.BETTER_AUTH_URL,
      required: true,
    },

    // Google OAuth
    {
      key: "GOOGLE_CLIENT_ID",
      value: process.env.GOOGLE_CLIENT_ID,
      required: true,
    },
    {
      key: "GOOGLE_CLIENT_SECRET",
      value: process.env.GOOGLE_CLIENT_SECRET,
      required: true,
    },

    // R2
    { key: "R2_ENDPOINT", value: process.env.R2_ENDPOINT, required: true },
    {
      key: "R2_ACCESS_KEY_ID",
      value: process.env.R2_ACCESS_KEY_ID,
      required: true,
    },
    {
      key: "R2_SECRET_ACCESS_KEY",
      value: process.env.R2_SECRET_ACCESS_KEY,
      required: true,
    },
    {
      key: "R2_BUCKET_NAME",
      value: process.env.R2_BUCKET_NAME,
      required: true,
    },

    // Cloudflare AI Gateway (BYOK - Replicate token stored in CF Secrets Store)
    {
      key: "CF_AI_GATEWAY_ACCOUNT_ID",
      value: process.env.CF_AI_GATEWAY_ACCOUNT_ID,
      required: true,
    },
    {
      key: "CF_AI_GATEWAY_ID",
      value: process.env.CF_AI_GATEWAY_ID,
      required: true,
    },
    {
      key: "CF_AIG_AUTH_TOKEN",
      value: process.env.CF_AIG_AUTH_TOKEN,
      required: true,
    },
  ];

  const missing = requiredVars.filter((v) => v.required && (!v.value || v.value.trim() === ""));

  if (missing.length > 0) {
    const missingKeys = missing.map((v) => `  - ${v.key}`).join("\n");
    throw new EnvironmentError(
      `Missing required environment variables:\n${missingKeys}\n\n` +
        `Please configure these in your .env file or deployment environment.`,
    );
  }
}

// Export typed environment variables
export const ENV = {
  // Better Auth
  BETTER_AUTH_SECRET: () => getRequiredEnv("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: () => getRequiredEnv("BETTER_AUTH_URL"),

  // Google OAuth
  GOOGLE_CLIENT_ID: () => getRequiredEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: () => getRequiredEnv("GOOGLE_CLIENT_SECRET"),

  // R2
  R2_ENDPOINT: () => getRequiredEnv("R2_ENDPOINT"),
  R2_ACCESS_KEY_ID: () => getRequiredEnv("R2_ACCESS_KEY_ID"),
  R2_SECRET_ACCESS_KEY: () => getRequiredEnv("R2_SECRET_ACCESS_KEY"),
  R2_BUCKET_NAME: () => getRequiredEnv("R2_BUCKET_NAME"),

  // Cloudflare AI Gateway (BYOK)
  CF_AI_GATEWAY_ACCOUNT_ID: () => getRequiredEnv("CF_AI_GATEWAY_ACCOUNT_ID"),
  CF_AI_GATEWAY_ID: () => getRequiredEnv("CF_AI_GATEWAY_ID"),
  CF_AIG_AUTH_TOKEN: () => getRequiredEnv("CF_AIG_AUTH_TOKEN"),

  // Replicate webhook (still needed - webhooks come directly from Replicate)
  REPLICATE_WEBHOOK_SECRET: () => getEnvVar("REPLICATE_WEBHOOK_SECRET", false),
} as const;
