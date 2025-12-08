import { z } from "zod";

/**
 * Schema for account deletion request
 * Requires the user to type their email address for confirmation
 */
export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .min(1, "Email confirmation is required")
    .email({ message: "Invalid email address" }),
});

/**
 * Type inference for account deletion request
 */
export type DeleteAccountRequest = z.infer<typeof deleteAccountSchema>;
