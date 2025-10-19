// User type (database representation)
export interface User {
  id: string              // UUID from auth.users
  email: string           // User's email address
  display_name: string    // From user_profiles table
  created_at: string      // ISO timestamp
}

// Login credentials
export interface LoginCredentials {
  email: string
  password: string
}

// Registration data
export interface RegisterData {
  email: string
  password: string
  displayName: string
}
