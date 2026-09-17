import { store } from '../../../data/store'
import type { DeliveryZone } from '../../../data/delivery'
import { requireAdmin } from '../../../utils/adminAuth'
const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
export default defineEventHandler(async event => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  const zone = await readBody<DeliveryZone>(event)
  if (!/^[a-z0-9-]{2,60}$/.test(id) || zone?.id !== id || !zone.name?.trim() || !Number.isFinite(zone.fee) || zone.fee < 0 || !Array.isArray(zone.weekdays) || zone.weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6) || !Array.isArray(zone.deliveryTimes) || (zone.available && (!zone.weekdays.length || !zone.deliveryTimes.length)) || zone.deliveryTimes.some(time => !validTime(time))) throw createError({ statusCode: 400, statusMessage: 'Revisa los días y horas de la zona' })
  const next = { id, name: zone.name.trim(), fee: zone.fee, available: Boolean(zone.available), weekdays: [...new Set(zone.weekdays)], deliveryTimes: [...new Set(zone.deliveryTimes)].sort() }
  const index = store.zones.findIndex(item => item.id === id)
  if (index < 0) store.zones.push(next)
  else store.zones[index] = next
  return next
})
