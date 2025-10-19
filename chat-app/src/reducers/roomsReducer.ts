import { ChatRoom } from '@/types/room'

export interface RoomsState {
  rooms: ChatRoom[]
  activeRoomId: string | null
  loading: boolean
  error: string | null
}

export type RoomsAction =
  // Fetch rooms
  | { type: 'FETCH_ROOMS_LOADING' }
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'FETCH_ROOMS_ERROR'; payload: string }
  // Create room
  | { type: 'CREATE_ROOM_LOADING' }
  | { type: 'ADD_ROOM_OPTIMISTIC'; payload: ChatRoom }
  | { type: 'REPLACE_ROOM'; payload: { tempId: string; room: ChatRoom } }
  | { type: 'REMOVE_ROOM'; payload: string }
  | { type: 'CREATE_ROOM_ERROR'; payload: string }
  // Join room
  | { type: 'JOIN_ROOM_LOADING'; payload: string }
  | { type: 'JOIN_ROOM_SUCCESS'; payload: string }
  | { type: 'JOIN_ROOM_ERROR'; payload: string }
  // Leave room
  | { type: 'LEAVE_ROOM_LOADING'; payload: string }
  | { type: 'LEAVE_ROOM_SUCCESS'; payload: string }
  | { type: 'LEAVE_ROOM_ERROR'; payload: string }
  // Active room
  | { type: 'SET_ACTIVE_ROOM'; payload: string | null }
  // Error handling
  | { type: 'CLEAR_ERROR' }

export const initialRoomsState: RoomsState = {
  rooms: [],
  activeRoomId: null,
  loading: false,
  error: null
}

export function roomsReducer(state: RoomsState, action: RoomsAction): RoomsState {
  switch (action.type) {
    case 'FETCH_ROOMS_LOADING':
    case 'CREATE_ROOM_LOADING':
      return { ...state, loading: true, error: null }

    case 'SET_ROOMS':
      return {
        ...state,
        rooms: action.payload,
        loading: false,
        error: null
      }

    case 'ADD_ROOM_OPTIMISTIC':
      return {
        ...state,
        rooms: [action.payload, ...state.rooms]
      }

    case 'REPLACE_ROOM':
      return {
        ...state,
        rooms: state.rooms.map(room =>
          room.id === action.payload.tempId ? action.payload.room : room
        ),
        loading: false
      }

    case 'REMOVE_ROOM':
      return {
        ...state,
        rooms: state.rooms.filter(room => room.id !== action.payload)
      }

    case 'JOIN_ROOM_LOADING':
    case 'LEAVE_ROOM_LOADING':
      return { ...state, loading: true, error: null }

    case 'JOIN_ROOM_SUCCESS':
    case 'LEAVE_ROOM_SUCCESS':
      return { ...state, loading: false, error: null }

    case 'FETCH_ROOMS_ERROR':
    case 'CREATE_ROOM_ERROR':
    case 'JOIN_ROOM_ERROR':
    case 'LEAVE_ROOM_ERROR':
      return { ...state, loading: false, error: action.payload }

    case 'SET_ACTIVE_ROOM':
      return { ...state, activeRoomId: action.payload }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    default:
      return state
  }
}
