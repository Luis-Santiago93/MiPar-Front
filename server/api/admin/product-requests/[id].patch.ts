import { store, type ProductRequest } from '../../../data/store'
import { requireAdmin } from '../../../utils/adminAuth'
export default defineEventHandler(async event => {
  requireAdmin(event)
  const request = store.productRequests.find(item => item.id === getRouterParam(event, 'id'))
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Solicitud no encontrada' })
  const body = await readBody<{ status: ProductRequest['status'] }>(event)
  if (!['nueva', 'contactada', 'cerrada', 'cancelada'].includes(body?.status)) throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  if (request.status === 'cancelada' && body.status !== 'cancelada') throw createError({ statusCode: 409, statusMessage: 'La solicitud cancelada no puede reactivarse' })
  request.status = body.status
  return request
})
