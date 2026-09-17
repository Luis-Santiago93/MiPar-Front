import { store, type OrderStatus } from '../../../data/store'
import { requireAdmin } from '../../../utils/adminAuth'
export default defineEventHandler(async event => {
  requireAdmin(event)
  const order = store.orders.find(item => item.id === getRouterParam(event, 'id'))
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Pedido no encontrado' })
  const body = await readBody<{ status: OrderStatus }>(event)
  if (!['nuevo', 'confirmado', 'vendido'].includes(body?.status)) throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  if (order.status === 'vendido' && body.status !== 'vendido') throw createError({ statusCode: 409, statusMessage: 'La venta ya fue concretada y no puede cambiar de estado' })
  order.status = body.status
  order.soldAt = body.status === 'vendido' ? order.soldAt ?? new Date().toISOString() : undefined
  return order
})
