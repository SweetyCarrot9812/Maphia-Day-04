'use client'

import { ChatRoom } from '@/types/room'
import { formatRelativeTime } from '@/utils/date/formatDate'
import { truncateString } from '@/utils/string/truncate'
import { Button } from '@/components/common/Button'
import { useRooms } from '@/contexts/RoomsContext'
import { useRouter } from 'next/navigation'

interface RoomCardProps {
  room: ChatRoom
}

export function RoomCard({ room }: RoomCardProps) {
  const { joinRoom } = useRooms()
  const router = useRouter()

  const handleJoin = async () => {
    await joinRoom(room.id)
    router.push(`/rooms/${room.id}`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="font-bold text-lg mb-2">{room.name}</h3>

      {room.description && (
        <p className="text-sm text-gray-600 mb-3">
          {truncateString(room.description, 100)}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>{room.member_count || 0} members</span>
        {room.last_message_at && (
          <span>{formatRelativeTime(room.last_message_at)}</span>
        )}
      </div>

      <Button onClick={handleJoin} fullWidth>
        Join Room
      </Button>
    </div>
  )
}
