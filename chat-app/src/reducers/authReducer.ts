import { User } from '@/types/auth'

// State shape
export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Action types (discriminated union for type safety)
export type AuthAction =
  // Login actions
  | { type: 'LOGIN_LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  // Register actions
  | { type: 'REGISTER_LOADING' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_ERROR'; payload: string }
  // Logout actions
  | { type: 'LOGOUT_LOADING' }
  | { type: 'LOGOUT_SUCCESS' }
  // Session management
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SESSION_LOADING' }
  | { type: 'SESSION_RESTORED'; payload: User }
  | { type: 'SESSION_EXPIRED' }
  // Error handling
  | { type: 'CLEAR_ERROR' }

// Initial state
export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null
}

// Reducer function (pure, immutable updates)
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    // Loading states
    case 'LOGIN_LOADING':
    case 'REGISTER_LOADING':
    case 'LOGOUT_LOADING':
    case 'SESSION_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      }

    // Success states with user data
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
    case 'SESSION_RESTORED':
      return {
        user: action.payload,
        loading: false,
        error: null
      }

    // Error states
    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      }

    // Logout and session expiry (reset to initial)
    case 'LOGOUT_SUCCESS':
    case 'SESSION_EXPIRED':
      return initialAuthState

    // Direct user set (for session restore)
    case 'SET_USER':
      return {
        ...state,
        user: action.payload
      }

    // Clear error
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }

    default:
      return state
  }
}
