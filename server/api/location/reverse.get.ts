const cache = new Map<string, string | null>()
let nextRequestAt = 0
let queue = Promise.resolve()

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const lat = Number(query.lat)
  const lon = Number(query.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw createError({ statusCode: 400, statusMessage: 'Coordenadas inválidas' })
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`
  if (cache.has(key)) return { address: cache.get(key) }

  const task = queue.then(async () => {
    if (cache.has(key)) return { address: cache.get(key) }
    await new Promise(resolve => setTimeout(resolve, Math.max(0, nextRequestAt - Date.now())))
    nextRequestAt = Date.now() + 1100
    const params = new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lon), zoom: '18', 'accept-language': 'es' })
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { headers: { 'User-Agent': 'MiPar/1.0 (reverse geocoding for local footwear checkout)' } })
    if (!response.ok) throw createError({ statusCode: 502, statusMessage: 'No se pudo consultar la dirección' })
    const result = await response.json() as { display_name?: string }
    const address = result.display_name ?? null
    cache.set(key, address)
    return { address }
  })
  queue = task.then(() => undefined, () => undefined)
  return task
})
