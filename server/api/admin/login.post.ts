import { credentialsMatch, createAdminSession } from '../../utils/adminAuth'
export default defineEventHandler(async event => {
  const body = await readBody<{ username: string; password: string }>(event)
  if (!credentialsMatch(event, body?.username?.trim() ?? '', body?.password ?? '')) throw createError({ statusCode: 401, statusMessage: 'Usuario o contraseña incorrectos' })
  createAdminSession(event)
  return { authenticated: true }
})
