'use client'

import { useState } from 'react'
import { RoomList } from '@/components/rooms/RoomList'
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/common/Button'

export default function RoomsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Chat Rooms</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create Room
        </Button>
      </div>

      <RoomList />

      <CreateRoomDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </Container>
  )
}
