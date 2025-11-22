'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/schemas/auth'
import { Brand } from '@/components/Brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { Toaster } from '@/components/ui/sonner'
import { CheckCircle, AlertCircle } from 'lucide-react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'
type TokenState = 'checking' | 'valid' | 'invalid'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [formState, setFormState] = useState<FormState>('idle')
  const [tokenState, setTokenState] = useState<TokenState>('checking')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  })

  // Watch password field for strength indicator
  const passwordValue = watch('password')

  // Check for valid reset token on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          setTokenState('invalid')
        } else {
          setTokenState('valid')
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setTokenState('invalid')
      }
    }

    checkToken()
  }, [supabase])

  // Calculate password strength
  const getPasswordStrength = (password: string): number => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 12.5
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 12.5
    return Math.min(strength, 100)
  }

  const getPasswordStrengthLabel = (strength: number): { text: string; color: string } => {
    if (strength === 0) return { text: '', color: '' }
    if (strength < 50) return { text: 'Weak', color: 'text-red-600' }
    if (strength < 75) return { text: 'Fair', color: 'text-orange-600' }
    if (strength < 100) return { text: 'Good', color: 'text-yellow-600' }
    return { text: 'Strong', color: 'text-emerald-600' }
  }

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 50) return 'bg-red-600'
    if (strength < 75) return 'bg-orange-600'
    if (strength < 100) return 'bg-yellow-600'
    return 'bg-emerald-600'
  }

  // Handle password reset form submission
  const onSubmit = async (data: ResetPasswordFormData) => {
    setFormState('submitting')

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes('session')) {
          toast.error('Reset link has expired. Please request a new one.')
          setFormState('error')
          setTokenState('invalid')
        } else if (error.message.includes('Password')) {
          toast.error('Password does not meet requirements')
          setFormState('error')
        } else {
          toast.error(error.message)
          setFormState('error')
        }
        return
      }

      // Success - show success state and redirect after 3 seconds
      setFormState('success')
      toast.success('Password updated successfully!')

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password'
      toast.error(errorMessage)
      setFormState('error')
    }
  }

  const passwordStrength = getPasswordStrength(passwordValue || '')
  const strengthLabel = getPasswordStrengthLabel(passwordStrength)

  // Show loading state while checking token
  if (tokenState === 'checking') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Verifying reset link...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toaster />

      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md shadow-depth-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-block">
            <Brand size="lg" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-depth-md p-8">
            {tokenState === 'invalid' ? (
              /* Invalid Token State */
              <div className="text-center">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-full opacity-20 blur-xl" />
                  <div className="relative w-full h-full bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Invalid or expired link
                </h1>

                {/* Message */}
                <p className="text-slate-600 mb-6">
                  This password reset link has expired or is invalid. Please request a new one.
                </p>

                {/* Request new link button */}
                <Link href="/forgot-password">
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-depth-sm hover:shadow-depth-md transition-all duration-300">
                    Request new reset link
                  </Button>
                </Link>

                {/* Back to login */}
                <p className="mt-6 text-sm text-slate-600">
                  <Link
                    href="/login"
                    className="text-indigo-600 hover:text-indigo-700 underline font-semibold transition-colors"
                  >
                    Back to Sign in
                  </Link>
                </p>
              </div>
            ) : formState === 'success' ? (
              /* Success State */
              <div className="text-center">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full opacity-20 blur-xl" />
                  <div className="relative w-full h-full bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Password updated
                </h1>

                {/* Message */}
                <p className="text-slate-600 mb-6">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>

                {/* Redirect message */}
                <p className="text-sm text-slate-500 mb-6">
                  Redirecting you to sign in...
                </p>

                {/* Manual redirect button */}
                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-depth-sm hover:shadow-depth-md transition-all duration-300">
                    Sign in now
                  </Button>
                </Link>
              </div>
            ) : (
              /* Reset Password Form */
              <>
                {/* Title Section */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Create new password
                  </h1>
                  <p className="text-sm text-slate-600">
                    Enter your new password below
                  </p>
                </div>

                {/* Password Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        {...register('password')}
                        disabled={formState === 'submitting'}
                        aria-invalid={!!errors.password}
                        className="transition-all duration-300 pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}

                    {/* Password Strength Indicator */}
                    {passwordValue && passwordValue.length > 0 && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                        {strengthLabel.text && (
                          <p className={`text-xs font-medium ${strengthLabel.color}`}>
                            Password strength: {strengthLabel.text}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        {...register('confirmPassword')}
                        disabled={formState === 'submitting'}
                        aria-invalid={!!errors.confirmPassword}
                        className="transition-all duration-300 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={formState === 'submitting'}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-depth-sm hover:shadow-depth-md transition-all duration-300"
                  >
                    {formState === 'submitting' ? 'Resetting password...' : 'Reset password'}
                  </Button>
                </form>

                {/* Back to login link */}
                <p className="text-center text-sm text-slate-600">
                  Remember your password?{' '}
                  <Link
                    href="/login"
                    className="text-indigo-600 hover:text-indigo-700 underline font-semibold transition-colors"
                  >
                    Back to Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
