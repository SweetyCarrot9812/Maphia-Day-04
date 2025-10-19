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
    await register(email, password, displayName)

    if (!error) {
      router.push('/rooms')
    }
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
