/**
 * Utility function to clear authentication data
 * Useful for debugging or when token is corrupted
 */
export function clearAuthData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('nhh-coffee-user')
    console.log('✅ Authentication data cleared')
  }
}

// Make it available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAuth = clearAuthData
}
