import { proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const baseUrl = useRuntimeConfig(event).backendBaseUrl?.replace(/\/$/, '')
  if (!baseUrl || !event.path.startsWith('/api/')) return
  return proxyRequest(event, `${baseUrl}${event.path}`)
})
