const STORAGE_KEY = "redirectAfterLogin"

const SHARE_PATH = /^\/shared\/[A-Za-z0-9_-]+(\/show)?$/

export const rememberLoginRedirect = (path: string): void => {
  if (!SHARE_PATH.test(path)) return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, path)
  } catch {}
}

export const consumeLoginRedirect = (): string | null => {
  try {
    const path = window.sessionStorage.getItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    return path && SHARE_PATH.test(path) ? path : null
  } catch {
    return null
  }
}
