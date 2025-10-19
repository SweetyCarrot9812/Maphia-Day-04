'use client'

import { useRooms } from '@/contexts/RoomsContext'
import { RoomCard } from './RoomCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useEffect } from 'react'

export function RoomList() {
  const { rooms, loading, error, fetchRooms } = useRooms()

  useEffect(() => {
    fetchRooms()

    const interval = setInterval(fetchRooms, 10000)
    return () => clearInterval(interval)
  }, [fetchRooms])

  if (loading && rooms.length === 0) {
    return <LoadingSpinner />
  }

  if (error && rooms.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchRooms} />
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No rooms yet. Create the first one!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map(room => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  )
}
