'use client'

import { FormEvent, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { isValidEmail } from '@/utils/validation/email'
import { isValidPassword } from '@/utils/validation/password'
import Link from 'next/link'

export function RegisterForm() {
  const { register, loading, error } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validation
    const errors: Record<string, string> = {}
    if (!displayName) errors.displayName = 'Display name is required'
    else if (displayName.length < 2) errors.displayName = 'Display name too short'
    if (!email) errors.email = 'Email is required'
    else if (!isValidEmail(email)) errors.email = 'Invalid email format'
    if (!password) errors.password = 'Password is required'
    else if (!isValidPassword(password)) errors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})

    try {
      const result = await register(email, password, displayName)

      if (result?.needsEmailConfirmation) {
        // Show email confirmation message
        setShowEmailConfirmation(true)
      } else if (!error) {
        // Auto-login successful, redirect to rooms
        router.push('/rooms')
      }
    } catch (err) {
      // Error already handled by authActions
      console.error('Registration error:', err)
    }
  }

  // Show email confirmation message if needed
  if (showEmailConfirmation) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg bg-blue-50 p-6 border border-blue-200">
          <svg className="w-16 h-16 mx-auto mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            이메일을 확인해주세요
          </h2>
          <p className="text-gray-600 mb-4">
            <span className="font-semibold">{email}</span>로<br />
            가입 확인 이메일을 발송했습니다.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            이메일의 확인 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            로그인 페이지로 이동
          </Link>
        </div>

        <p className="text-sm text-gray-600">
          이메일을 받지 못하셨나요?{' '}
          <button
            type="button"
            onClick={() => setShowEmailConfirmation(false)}
            className="text-primary hover:underline"
          >
            다시 시도
          </button>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="text"
        label="Display Name"
        placeholder="John Doe"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        disabled={loading}
        error={formErrors.displayName}
        required
      />

      <Input
        type="email"
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        error={formErrors.email}
        required
      />

      <Input
        type="password"
        label="Password"
        placeholder="Min 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        error={formErrors.password}
        required
      />

      <Input
        type="password"
        label="Confirm Password"
        placeholder="Repeat password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        error={formErrors.confirmPassword}
        required
      />

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <Button type="submit" disabled={loading} fullWidth>
        {loading ? 'Creating account...' : 'Register'}
      </Button>

      <p className="text-sm text-center text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  )
}
