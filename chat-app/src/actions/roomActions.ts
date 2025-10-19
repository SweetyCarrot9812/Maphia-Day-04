import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { RoomsAction } from '@/reducers/roomsReducer'
import { ChatRoom } from '@/types/room'

/**
 * Fetch all rooms with metadata
 */
export async function fetchRooms(dispatch: Dispatch<RoomsAction>): Promise<void> {
  dispatch({ type: 'FETCH_ROOMS_LOADING' })

  try {
    const { data, error } = await supabase.rpc('get_rooms_with_metadata')

    if (error) throw error

    dispatch({
      type: 'SET_ROOMS',
      payload: data as ChatRoom[]
    })
  } catch (error) {
    dispatch({
      type: 'FETCH_ROOMS_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to fetch rooms'
    })
  }
}

/**
 * Create new chat room
 */
export async function createRoom(
  name: string,
  description: string | undefined,
  dispatch: Dispatch<RoomsAction>
): Promise<ChatRoom | null> {
  dispatch({ type: 'CREATE_ROOM_LOADING' })

  // Optimistic update
  const tempId = `temp-${Date.now()}`
  const optimisticRoom: ChatRoom = {
    id: tempId,
    name,
    description: description || null,
    created_by: '', // Will be set by database
    created_at: new Date().toISOString(),
    member_count: 1
  }

  dispatch({
    type: 'ADD_ROOM_OPTIMISTIC',
    payload: optimisticRoom
  })

  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({ name, description })
      .select()
      .single()

    if (error) throw error

    // Replace optimistic with real data
    dispatch({
      type: 'REPLACE_ROOM',
      payload: { tempId, room: data as ChatRoom }
    })

    return data as ChatRoom
  } catch (error) {
    // Remove optimistic room
    dispatch({ type: 'REMOVE_ROOM', payload: tempId })

    dispatch({
      type: 'CREATE_ROOM_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to create room'
    })

    return null
  }
}

/**
 * Join existing room
 */
export async function joinRoom(
  roomId: string,
  dispatch: Dispatch<RoomsAction>
): Promise<void> {
  dispatch({ type: 'JOIN_ROOM_LOADING', payload: roomId })

  try {
    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: roomId })

    // Ignore duplicate key error (already joined)
    if (error && !error.message.includes('duplicate')) {
      throw error
    }

    dispatch({ type: 'JOIN_ROOM_SUCCESS', payload: roomId })
  } catch (error) {
    dispatch({
      type: 'JOIN_ROOM_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to join room'
    })
  }
}

/**
 * Leave room
 */
export async function leaveRoom(
  roomId: string,
  dispatch: Dispatch<RoomsAction>
): Promise<void> {
  dispatch({ type: 'LEAVE_ROOM_LOADING', payload: roomId })

  try {
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)

    if (error) throw error

    dispatch({ type: 'LEAVE_ROOM_SUCCESS', payload: roomId })
  } catch (error) {
    dispatch({
      type: 'LEAVE_ROOM_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to leave room'
    })
  }
}

/**
 * Set active room (UI state)
 */
export function setActiveRoom(
  roomId: string | null,
  dispatch: Dispatch<RoomsAction>
): void {
  dispatch({ type: 'SET_ACTIVE_ROOM', payload: roomId })
}

/**
 * Clear error
 */
export function clearError(dispatch: Dispatch<RoomsAction>): void {
  dispatch({ type: 'CLEAR_ERROR' })
}
