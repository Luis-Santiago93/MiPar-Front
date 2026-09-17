import { store } from '../../../data/store'
import { requireAdmin } from '../../../utils/adminAuth'

export default defineEventHandler(event => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  const index = store.zones.findIndex(zone => zone.id === id)
  if (index < 0) throw createError({ statusCode: 404, statusMessage: 'Zona no encontrada' })
  if (store.orders.some(order => order.zoneId === id)) throw createError({ statusCode: 409, statusMessage: 'La zona tiene pedidos registrados' })
  store.zones.splice(index, 1)
  setResponseStatus(event, 204)
  return null
})
