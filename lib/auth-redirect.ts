export const DEFAULT_CALLBACK_URL = '/dashboard'

export function normalizeCallbackURL(rawCallbackURL: string | null | undefined) {
  if (!rawCallbackURL) {
    return DEFAULT_CALLBACK_URL
  }

  const value = rawCallbackURL.trim()
  if (!value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_CALLBACK_URL
  }

  return value
}

export function buildCallbackURL(pathname: string, search: string) {
  const currentPath = pathname.trim().length > 0 ? pathname : DEFAULT_CALLBACK_URL
  const query = search.startsWith('?') ? search : search ? `?${search}` : ''
  return normalizeCallbackURL(`${currentPath}${query}`)
}

export function createSignInPath(callbackURL: string) {
  const normalized = normalizeCallbackURL(callbackURL)
  const search = new URLSearchParams({ callbackURL: normalized })
  return `/sign-in?${search.toString()}`
}
