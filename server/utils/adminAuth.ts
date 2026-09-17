import type { H3Event } from 'h3'

const sessions = new Map<string, number>()
const cookieName = 'mipar_admin_session'
export function credentialsMatch(event: H3Event, username: string, password: string) {
  const config = useRuntimeConfig(event)
  const expectedUser = config.adminUser || (import.meta.dev ? 'admin' : '')
  const expectedPassword = config.adminPassword || (import.meta.dev ? 'mipar123' : '')
  return Boolean(expectedUser && expectedPassword && username === expectedUser && password === expectedPassword)
}
export function createAdminSession(event: H3Event) {
  const token = crypto.randomUUID()
  sessions.set(token, Date.now() + 8 * 60 * 60 * 1000)
  setCookie(event, cookieName, token, { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev, path: '/', maxAge: 8 * 60 * 60 })
}
export function isAdmin(event: H3Event) {
  const token = getCookie(event, cookieName)
  const expires = token ? sessions.get(token) : undefined
  if (!expires) return false
  if (expires < Date.now()) { sessions.delete(token!); return false }
  return true
}
export function requireAdmin(event: H3Event) {
  if (!isAdmin(event)) throw createError({ statusCode: 401, statusMessage: 'Inicia sesión para entrar al backoffice' })
}
export function closeAdminSession(event: H3Event) {
  const token = getCookie(event, cookieName)
  if (token) sessions.delete(token)
  deleteCookie(event, cookieName, { path: '/' })
}
