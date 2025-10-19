'use client'

import { FormEvent, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { isValidEmail } from '@/utils/validation/email'
import Link from 'next/link'

export function LoginForm() {
  const { login, loading, error } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validation
    const errors: Record<string, string> = {}
    if (!email) errors.email = 'Email is required'
    else if (!isValidEmail(email)) errors.email = 'Invalid email format'
    if (!password) errors.password = 'Password is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    await login(email, password)

    if (!error) {
      router.push('/rooms')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        error={formErrors.password}
        required
      />

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <Button type="submit" disabled={loading} fullWidth>
        {loading ? 'Logging in...' : 'Login'}
      </Button>

      <p className="text-sm text-center text-gray-600">
        Don't have an account?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </form>
  )
}
