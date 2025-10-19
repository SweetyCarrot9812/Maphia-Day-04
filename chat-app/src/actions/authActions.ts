import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { AuthAction } from '@/reducers/authReducer'

/**
 * Login action - Authenticate user with email and password
 */
export async function login(
  email: string,
  password: string,
  dispatch: Dispatch<AuthAction>
): Promise<void> {
  dispatch({ type: 'LOGIN_LOADING' })

  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) throw profileError

    // Dispatch success with merged user data
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        id: authData.user.id,
        email: authData.user.email!,
        display_name: profile.display_name,
        created_at: authData.user.created_at
      }
    })
  } catch (error) {
    dispatch({
      type: 'LOGIN_ERROR',
      payload: error instanceof Error ? error.message : 'Login failed'
    })
  }
}

/**
 * Register action - Create new user account
 */
export async function register(
  email: string,
  password: string,
  displayName: string,
  dispatch: Dispatch<AuthAction>
): Promise<void> {
  dispatch({ type: 'REGISTER_LOADING' })

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Registration failed')

    // Profile created automatically by database trigger
    // Verify it exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      // Fallback: create profile manually if trigger failed
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          display_name: displayName
        })

      if (insertError) throw insertError
    }

    dispatch({
      type: 'REGISTER_SUCCESS',
      payload: {
        id: authData.user.id,
        email: authData.user.email!,
        display_name: profile?.display_name || displayName,
        created_at: authData.user.created_at
      }
    })
  } catch (error) {
    dispatch({
      type: 'REGISTER_ERROR',
      payload: error instanceof Error ? error.message : 'Registration failed'
    })
  }
}

/**
 * Logout action - Sign out current user
 */
export async function logout(dispatch: Dispatch<AuthAction>): Promise<void> {
  dispatch({ type: 'LOGOUT_LOADING' })

  try {
    await supabase.auth.signOut()
    dispatch({ type: 'LOGOUT_SUCCESS' })
  } catch (error) {
    // Force logout even on error (clear client state)
    console.error('Logout error:', error)
    dispatch({ type: 'LOGOUT_SUCCESS' })
  }
}

/**
 * Refresh session - Check if user is still authenticated
 */
export async function refreshSession(dispatch: Dispatch<AuthAction>): Promise<void> {
  dispatch({ type: 'SESSION_LOADING' })

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error

    if (user) {
      // Fetch profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      dispatch({
        type: 'SESSION_RESTORED',
        payload: {
          id: user.id,
          email: user.email!,
          display_name: profile?.display_name || 'User',
          created_at: user.created_at
        }
      })
    } else {
      dispatch({ type: 'SESSION_EXPIRED' })
    }
  } catch (error) {
    console.error('Session refresh error:', error)
    dispatch({ type: 'SESSION_EXPIRED' })
  }
}

/**
 * Clear error - Remove error message from state
 */
export function clearError(dispatch: Dispatch<AuthAction>): void {
  dispatch({ type: 'CLEAR_ERROR' })
}
