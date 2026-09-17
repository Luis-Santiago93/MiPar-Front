import { store } from '../../../data/store'
import { requireAdmin } from '../../../utils/adminAuth'
export default defineEventHandler(event => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (store.orders.some(order => order.items.some(item => item.productId === id))) throw createError({ statusCode: 409, statusMessage: 'El producto ya tiene pedidos; no se puede eliminar' })
  if (store.productRequests.some(request => request.productId === id)) throw createError({ statusCode: 409, statusMessage: 'El producto ya tiene solicitudes; consérvalo en el catálogo' })
  const index = store.products.findIndex(item => item.id === id)
  if (index < 0) throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado' })
  store.products.splice(index, 1)
  return { deleted: true }
})
