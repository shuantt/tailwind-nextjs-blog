// Both management interfaces use Artalk's owner token on the same browser origin.
export function ownerAuthorization(): Record<string, string> {
  try {
    const user = JSON.parse(localStorage.getItem('ArtalkUser') || '{}')
    if (typeof user?.token === 'string' && user.token) {
      return { Authorization: `Bearer ${user.token}` }
    }
  } catch {
    // Browser data is only a credential carrier; the server verifies the identity.
  }
  return {}
}

export async function logoutOwner() {
  // Clear obsolete Guestbook cookies too; they no longer grant access.
  const response = await fetch('/api/guestbook/auth/logout', { method: 'POST' })
  if (!response.ok) throw new Error('登出失敗，請重試。')
  localStorage.removeItem('ArtalkUser')
  window.dispatchEvent(new Event('artalk-logout'))
  window.dispatchEvent(new Event('artalk-user-changed'))
}
