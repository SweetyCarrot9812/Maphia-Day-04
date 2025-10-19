import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { MessagesAction } from '@/reducers/messagesReducer'
import { Message, MessageLike } from '@/types/message'

/**
 * Fetch messages for a room
 */
export async function fetchMessages(
  roomId: string,
  since?: string,
  dispatch?: Dispatch<MessagesAction>
): Promise<void> {
  if (dispatch) {
    dispatch({ type: 'FETCH_MESSAGES_LOADING' })
  }

  try {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (since) {
      query = query.gt('created_at', since)
    } else {
      query = query.limit(50)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      // Return empty array instead of throwing on error
      // This allows the UI to show "no messages" instead of error state
      if (dispatch) {
        dispatch({ type: 'SET_MESSAGES', payload: { roomId, messages: [] } })
      }
      return
    }

    // Fetch user profiles separately for now
    // TODO: Fix foreign key relationship to enable proper join
    const messages = (data || []).map(msg => {
      // Find parent message content if this is a reply
      let parent_content = null
      let parent_author = null
      if (msg.parent_message_id) {
        const parentMsg = data.find(m => m.id === msg.parent_message_id)
        if (parentMsg) {
          parent_content = parentMsg.deleted_at ? '[Deleted message]' : parentMsg.content
          parent_author = 'User' // Temporary
        }
      }

      return {
        ...msg,
        author_name: 'User', // Temporary - will fix after establishing proper FK
        parent_content,
        parent_author
      }
    })

    if (dispatch) {
      if (since) {
        dispatch({ type: 'APPEND_MESSAGES', payload: { roomId, messages } })
      } else {
        dispatch({ type: 'SET_MESSAGES', payload: { roomId, messages } })
      }

      // Fetch likes for messages
      await fetchLikesForMessages(messages, dispatch)
    }
  } catch (error) {
    if (dispatch) {
      dispatch({
        type: 'FETCH_MESSAGES_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to fetch messages'
      })
    }
  }
}

/**
 * Send message
 */
export async function sendMessage(
  roomId: string,
  content: string,
  type: 'text' | 'emoji',
  parentMessageId: string | null,
  dispatch: Dispatch<MessagesAction>,
  userId: string
): Promise<void> {
  const tempId = `temp-${Date.now()}`

  // Optimistic update
  const optimisticMessage: Message = {
    id: tempId,
    room_id: roomId,
    user_id: userId,
    content,
    type,
    parent_message_id: parentMessageId,
    created_at: new Date().toISOString(),
    deleted_at: null,
    status: 'sending',
    tempId
  }

  dispatch({
    type: 'ADD_MESSAGE_OPTIMISTIC',
    payload: { roomId, message: optimisticMessage }
  })

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        content,
        type,
        parent_message_id: parentMessageId
      })
      .select()
      .single()

    if (error) throw error

    dispatch({
      type: 'REPLACE_MESSAGE',
      payload: {
        roomId,
        tempId,
        message: { ...data, status: 'sent' }
      }
    })
  } catch (error) {
    dispatch({
      type: 'MESSAGE_SEND_FAILED',
      payload: {
        roomId,
        tempId,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }
    })
  }
}

/**
 * Delete message (soft delete)
 */
export async function deleteMessage(
  messageId: string,
  roomId: string,
  dispatch: Dispatch<MessagesAction>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)

    if (error) throw error

    dispatch({
      type: 'DELETE_MESSAGE_SUCCESS',
      payload: { roomId, messageId }
    })
  } catch (error) {
    dispatch({
      type: 'DELETE_MESSAGE_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to delete message'
    })
  }
}

/**
 * Like message
 */
export async function likeMessage(
  messageId: string,
  userId: string,
  dispatch: Dispatch<MessagesAction>
): Promise<void> {
  // Optimistic update
  dispatch({
    type: 'TOGGLE_LIKE_OPTIMISTIC',
    payload: { messageId, userId, liked: true }
  })

  try {
    const { error } = await supabase
      .from('message_likes')
      .insert({ message_id: messageId, user_id: userId })

    if (error) throw error
  } catch (error) {
    // Revert optimistic update
    dispatch({
      type: 'TOGGLE_LIKE_OPTIMISTIC',
      payload: { messageId, userId, liked: false }
    })
  }
}

/**
 * Unlike message
 */
export async function unlikeMessage(
  messageId: string,
  userId: string,
  dispatch: Dispatch<MessagesAction>
): Promise<void> {
  // Optimistic update
  dispatch({
    type: 'TOGGLE_LIKE_OPTIMISTIC',
    payload: { messageId, userId, liked: false }
  })

  try {
    const { error } = await supabase
      .from('message_likes')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    // Revert optimistic update
    dispatch({
      type: 'TOGGLE_LIKE_OPTIMISTIC',
      payload: { messageId, userId, liked: true }
    })
  }
}

/**
 * Set reply target
 */
export function setReplyTarget(
  message: Message | null,
  dispatch: Dispatch<MessagesAction>
): void {
  dispatch({ type: 'SET_REPLY_TARGET', payload: message })
}

/**
 * Clear reply target
 */
export function clearReplyTarget(dispatch: Dispatch<MessagesAction>): void {
  dispatch({ type: 'CLEAR_REPLY_TARGET' })
}

/**
 * Clear error
 */
export function clearError(dispatch: Dispatch<MessagesAction>): void {
  dispatch({ type: 'CLEAR_ERROR' })
}

/**
 * Fetch likes for messages (helper)
 */
async function fetchLikesForMessages(
  messages: Message[],
  dispatch: Dispatch<MessagesAction>
): Promise<void> {
  const messageIds = messages.map(m => m.id)

  if (messageIds.length === 0) return

  const { data } = await supabase
    .from('message_likes')
    .select('*')
    .in('message_id', messageIds)

  if (data) {
    const likesByMessage = data.reduce((acc, like) => {
      if (!acc[like.message_id]) acc[like.message_id] = []
      acc[like.message_id].push(like)
      return acc
    }, {} as Record<string, MessageLike[]>)

    Object.entries(likesByMessage).forEach(([messageId, likes]) => {
      dispatch({ type: 'UPDATE_LIKES', payload: { messageId, likes } })
    })
  }
}
