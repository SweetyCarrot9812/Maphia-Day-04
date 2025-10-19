'use client'

import { Button } from '@/components/common/Button'
import { useRouter } from 'next/navigation'
import { ChatRoom } from '@/types/room'

interface RoomHeaderProps {
  room: ChatRoom
}

export function RoomHeader({ room }: RoomHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{room.name}</h2>
          {room.description && (
            <p className="text-sm text-gray-600">{room.description}</p>
          )}
        </div>

        <Button variant="secondary" onClick={() => router.push('/rooms')}>
          Back to Rooms
        </Button>
      </div>
    </div>
  )
}
