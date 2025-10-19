'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRooms } from '@/contexts/RoomsContext'
import { RoomHeader } from '@/components/rooms/RoomHeader'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorMessage } from '@/components/common/ErrorMessage'

export default function ChatRoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const { rooms, fetchRooms, setActiveRoom } = useRooms()
  const [room, setRoom] = useState(rooms.find(r => r.id === roomId))

  useEffect(() => {
    setActiveRoom(roomId)

    if (rooms.length === 0) {
      fetchRooms()
    }

    return () => {
      setActiveRoom(null)
    }
  }, [roomId, setActiveRoom, fetchRooms])

  useEffect(() => {
    setRoom(rooms.find(r => r.id === roomId))
  }, [rooms, roomId])

  if (!room && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ErrorMessage message="Room not found" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <RoomHeader room={room} />
      <MessageList roomId={roomId} />
      <MessageInput roomId={roomId} />
    </div>
  )
}
