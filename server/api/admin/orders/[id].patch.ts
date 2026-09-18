import { store, type OrderStatus } from '../../../data/store'
import { requireAdmin } from '../../../utils/adminAuth'
export default defineEventHandler(async event => {
  requireAdmin(event)
  const order = store.orders.find(item => item.id === getRouterParam(event, 'id'))
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Pedido no encontrado' })
  const body = await readBody<{ status: OrderStatus }>(event)
  if (!['nuevo', 'confirmado', 'vendido', 'cancelado'].includes(body?.status)) throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  if (['vendido', 'cancelado'].includes(order.status) && body.status !== order.status) throw createError({ statusCode: 409, statusMessage: 'El pedido ya tiene un estado final y no puede cambiar' })
  if (body.status === 'cancelado' && order.status !== 'cancelado') {
    for (const item of order.items) {
      const variant = store.products.find(product => product.id === item.productId)?.variants.find(variant => variant.color === item.color && variant.size === item.size)
      if (variant) variant.stock += item.quantity
    }
  }
  order.status = body.status
  order.soldAt = body.status === 'vendido' ? order.soldAt ?? new Date().toISOString() : undefined
  return order
})
