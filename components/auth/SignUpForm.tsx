"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signUp } from "@/lib/auth/client";
import type { PasswordStrengthResult } from "@/lib/password/strength";
import { type SignUpFormData, signUpSchema } from "@/lib/schemas/auth";
import { PasswordInput } from "./PasswordInput";

interface SignUpFormProps {
  /** Callback when sign up succeeds, before redirect */
  onSuccess?: () => void;
  /** Override the default callback URL (defaults to /wizard) */
  callbackURL?: string;
}

export function SignUpForm({ onSuccess, callbackURL }: SignUpFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const email = watch("email");
  const name = watch("name");

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue("password", e.target.value, { shouldValidate: true });
    },
    [setValue],
  );

  const handleStrengthChange = useCallback((result: PasswordStrengthResult | null) => {
    setPasswordStrength(result);
  }, []);

  const onSubmit = async (data: SignUpFormData) => {
    // Check password strength before submitting
    if (!passwordStrength?.isAcceptable) {
      toast.error("Please choose a stronger password");
      return;
    }

    setIsSubmitting(true);

    try {
      const redirectURL = callbackURL || "/wizard";
      const { error } = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: redirectURL,
      });

      if (error) {
        // Handle specific error cases
        const message = error.message?.toLowerCase() || "";

        if (message.includes("email") && message.includes("exist")) {
          toast.error("An account with this email already exists");
        } else if (message.includes("password")) {
          toast.error("Password does not meet requirements");
        } else {
          toast.error(error.message || "Sign up failed. Please try again.");
        }
        return;
      }

      // Notify user about verification email (soft requirement)
      toast.success("Account created! Check your email to verify your address.");
      onSuccess?.();
      router.push(redirectURL);
    } catch (err) {
      console.error("Sign up error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Field */}
      <div className="space-y-1.5">
        <label htmlFor="signup-name" className="block text-sm font-bold text-ink">
          Name
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          disabled={isSubmitting}
          {...register("name")}
          className={`
            w-full
            px-4
            py-2.5
            bg-cream
            text-ink
            font-medium
            border-3
            border-ink
            shadow-brutal-sm
            placeholder:text-ink/40
            focus:outline-none
            focus:shadow-brutal-md
            focus:translate-x-[-2px]
            focus:translate-y-[-2px]
            transition-all
            duration-150
            disabled:opacity-50
            disabled:cursor-not-allowed
            ${errors.name ? "border-brand" : ""}
          `}
        />
        {errors.name && <p className="text-sm text-brand font-medium">{errors.name.message}</p>}
      </div>

      {/* Email Field */}
      <div className="space-y-1.5">
        <label htmlFor="signup-email" className="block text-sm font-bold text-ink">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isSubmitting}
          {...register("email")}
          className={`
            w-full
            px-4
            py-2.5
            bg-cream
            text-ink
            font-medium
            border-3
            border-ink
            shadow-brutal-sm
            placeholder:text-ink/40
            focus:outline-none
            focus:shadow-brutal-md
            focus:translate-x-[-2px]
            focus:translate-y-[-2px]
            transition-all
            duration-150
            disabled:opacity-50
            disabled:cursor-not-allowed
            ${errors.email ? "border-brand" : ""}
          `}
        />
        {errors.email && <p className="text-sm text-brand font-medium">{errors.email.message}</p>}
      </div>

      {/* Password Field with Strength Meter */}
      <div className="space-y-1.5">
        <label htmlFor="signup-password" className="block text-sm font-bold text-ink">
          Password
        </label>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          disabled={isSubmitting}
          value={watch("password")}
          onChange={handlePasswordChange}
          showStrengthMeter
          email={email}
          name={name}
          checkBreach
          onStrengthChange={handleStrengthChange}
          hasError={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-brand font-medium">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="
          w-full
          mt-2
          px-5
          py-2.5
          bg-ink
          text-cream
          font-black
          border-3
          border-ink
          shadow-brutal-sm
          hover:-translate-x-0.5
          hover:-translate-y-0.5
          hover:shadow-brutal-md
          active:translate-x-0
          active:translate-y-0
          active:shadow-none
          transition-all
          duration-150
          disabled:opacity-50
          disabled:cursor-not-allowed
          disabled:hover:translate-x-0
          disabled:hover:translate-y-0
          disabled:hover:shadow-brutal-sm
          flex
          items-center
          justify-center
          gap-2
        "
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create account</span>
        )}
      </button>
    </form>
  );
}
