import { store, type ProductRequest } from '../../data/store'

export default defineEventHandler(async event => {
  const body = await readBody<{ productId: string; color: string; size: number; customer: { name: string; phone: string; notes?: string } }>(event)
  const product = store.products.find(item => item.id === body?.productId)
  const variant = product?.variants.find(item => item.color === body?.color && item.size === body?.size)
  if (!product || !variant) throw createError({ statusCode: 400, statusMessage: 'Selecciona un modelo, color y talla válidos' })
  if (!product.requestOnly && variant.stock > 0) throw createError({ statusCode: 409, statusMessage: 'Este par está disponible; agrégalo a la bolsa para hacer tu pedido' })
  const name = body?.customer?.name?.trim() ?? ''
  const digits = body?.customer?.phone?.replace(/\D/g, '') ?? ''
  const phone = digits.length === 12 && digits.startsWith('52') ? digits.slice(2) : digits
  const notes = body?.customer?.notes?.trim() ?? ''
  if (name.length < 2 || phone.length !== 10 || notes.length > 500) throw createError({ statusCode: 400, statusMessage: 'Escribe tu nombre, teléfono de 10 dígitos e indicaciones de hasta 500 caracteres' })
  const request: ProductRequest = {
    id: `SOL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: new Date().toISOString(), productId: product.id, productName: product.name,
    color: variant.color, size: variant.size, customer: { name, phone, notes }, status: 'nueva'
  }
  store.productRequests.unshift(request)
  setResponseStatus(event, 201)
  return request
})
