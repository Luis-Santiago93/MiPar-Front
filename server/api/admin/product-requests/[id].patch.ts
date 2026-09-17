import { store, type ProductRequest } from '../../../data/store'
import { requireAdmin } from '../../../utils/adminAuth'
export default defineEventHandler(async event => {
  requireAdmin(event)
  const request = store.productRequests.find(item => item.id === getRouterParam(event, 'id'))
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Solicitud no encontrada' })
  const body = await readBody<{ status: ProductRequest['status'] }>(event)
  if (!['nueva', 'contactada', 'cerrada'].includes(body?.status)) throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  request.status = body.status
  return request
})
