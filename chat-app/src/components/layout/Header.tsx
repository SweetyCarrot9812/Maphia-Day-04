'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Chat App</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.display_name}
          </span>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
