export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak'
  if (password.length < 12) return 'medium'
  return 'strong'
}
