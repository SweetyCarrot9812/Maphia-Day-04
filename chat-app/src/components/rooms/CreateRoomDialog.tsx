'use client'

import { useState, FormEvent } from 'react'
import { useRooms } from '@/contexts/RoomsContext'
import { Modal } from '@/components/common/Modal'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { useRouter } from 'next/navigation'
import { MAX_ROOM_NAME_LENGTH, MAX_ROOM_DESCRIPTION_LENGTH, MIN_ROOM_NAME_LENGTH } from '@/utils/constants'

interface CreateRoomDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateRoomDialog({ isOpen, onClose }: CreateRoomDialogProps) {
  const { createRoom, loading } = useRooms()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Room name is required'
    else if (name.trim().length < MIN_ROOM_NAME_LENGTH) errors.name = `Name must be at least ${MIN_ROOM_NAME_LENGTH} characters`
    else if (name.length > MAX_ROOM_NAME_LENGTH) errors.name = `Name must be max ${MAX_ROOM_NAME_LENGTH} characters`

    if (description.length > MAX_ROOM_DESCRIPTION_LENGTH) {
      errors.description = `Description must be max ${MAX_ROOM_DESCRIPTION_LENGTH} characters`
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    const newRoom = await createRoom(name.trim(), description.trim() || undefined)

    if (newRoom) {
      setName('')
      setDescription('')
      onClose()
      router.push(`/rooms/${newRoom.id}`)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setFormErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Room">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Room Name"
          placeholder="e.g., General Discussion"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          error={formErrors.name}
          maxLength={MAX_ROOM_NAME_LENGTH}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            placeholder="Brief description of this room..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            maxLength={MAX_ROOM_DESCRIPTION_LENGTH}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          {formErrors.description && (
            <p className="mt-1 text-sm text-error">{formErrors.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {description.length}/{MAX_ROOM_DESCRIPTION_LENGTH}
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
