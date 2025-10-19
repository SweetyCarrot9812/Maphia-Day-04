import { Message, MessageLike } from '@/types/message'

export interface MessagesState {
  messagesByRoom: Record<string, Message[]>
  likesCache: Record<string, MessageLike[]>
  replyTarget: Message | null
  loading: boolean
  error: string | null
}

export type MessagesAction =
  // Fetch messages
  | { type: 'FETCH_MESSAGES_LOADING' }
  | { type: 'SET_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'APPEND_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'FETCH_MESSAGES_ERROR'; payload: string }
  // Send message
  | { type: 'SEND_MESSAGE_LOADING' }
  | { type: 'ADD_MESSAGE_OPTIMISTIC'; payload: { roomId: string; message: Message } }
  | { type: 'REPLACE_MESSAGE'; payload: { roomId: string; tempId: string; message: Message } }
  | { type: 'MESSAGE_SEND_FAILED'; payload: { roomId: string; tempId: string; error: string } }
  // Delete message
  | { type: 'DELETE_MESSAGE_SUCCESS'; payload: { roomId: string; messageId: string } }
  | { type: 'DELETE_MESSAGE_ERROR'; payload: string }
  // Likes
  | { type: 'UPDATE_LIKES'; payload: { messageId: string; likes: MessageLike[] } }
  | { type: 'TOGGLE_LIKE_OPTIMISTIC'; payload: { messageId: string; userId: string; liked: boolean } }
  // Reply
  | { type: 'SET_REPLY_TARGET'; payload: Message | null }
  | { type: 'CLEAR_REPLY_TARGET' }
  // Error
  | { type: 'CLEAR_ERROR' }

export const initialMessagesState: MessagesState = {
  messagesByRoom: {},
  likesCache: {},
  replyTarget: null,
  loading: false,
  error: null
}

export function messagesReducer(
  state: MessagesState,
  action: MessagesAction
): MessagesState {
  switch (action.type) {
    case 'FETCH_MESSAGES_LOADING':
    case 'SEND_MESSAGE_LOADING':
      return { ...state, loading: true, error: null }

    case 'SET_MESSAGES':
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: action.payload.messages
        },
        loading: false
      }

    case 'APPEND_MESSAGES': {
      const existing = state.messagesByRoom[action.payload.roomId] || []
      const newMessages = action.payload.messages.filter(
        newMsg => !existing.some(msg => msg.id === newMsg.id)
      )
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: [...existing, ...newMessages]
        }
      }
    }

    case 'ADD_MESSAGE_OPTIMISTIC': {
      const existing = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: [...existing, action.payload.message]
        }
      }
    }

    case 'REPLACE_MESSAGE': {
      const messages = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: messages.map(msg =>
            msg.id === action.payload.tempId || msg.tempId === action.payload.tempId
              ? action.payload.message
              : msg
          )
        },
        loading: false
      }
    }

    case 'MESSAGE_SEND_FAILED': {
      const messages = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: messages.map(msg =>
            msg.id === action.payload.tempId
              ? { ...msg, status: 'failed' as const }
              : msg
          )
        },
        loading: false,
        error: action.payload.error
      }
    }

    case 'DELETE_MESSAGE_SUCCESS': {
      const messages = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: messages.map(msg =>
            msg.id === action.payload.messageId
              ? { ...msg, deleted_at: new Date().toISOString() }
              : msg
          )
        },
        loading: false
      }
    }

    case 'UPDATE_LIKES':
      return {
        ...state,
        likesCache: {
          ...state.likesCache,
          [action.payload.messageId]: action.payload.likes
        }
      }

    case 'TOGGLE_LIKE_OPTIMISTIC': {
      const currentLikes = state.likesCache[action.payload.messageId] || []
      const newLikes = action.payload.liked
        ? [...currentLikes, {
            message_id: action.payload.messageId,
            user_id: action.payload.userId,
            created_at: new Date().toISOString()
          }]
        : currentLikes.filter(like => like.user_id !== action.payload.userId)

      return {
        ...state,
        likesCache: {
          ...state.likesCache,
          [action.payload.messageId]: newLikes
        }
      }
    }

    case 'SET_REPLY_TARGET':
      return { ...state, replyTarget: action.payload }

    case 'CLEAR_REPLY_TARGET':
      return { ...state, replyTarget: null }

    case 'FETCH_MESSAGES_ERROR':
    case 'DELETE_MESSAGE_ERROR':
      return { ...state, loading: false, error: action.payload }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    default:
      return state
  }
}
