import type { CartItem } from '../../../app/types/shop'
import { quoteOrder, store, type Order } from '../../data/store'

export default defineEventHandler(async event => {
  const body = await readBody<{ items: CartItem[]; zoneId: string; deliveryDate: string; deliveryTime: string; customer: { name: string; phone: string; address: string; notes?: string; location?: { lat: number; lon: number } } }>(event)
  const name = body?.customer?.name?.trim()
  const phoneDigits = body?.customer?.phone?.replace(/\D/g, '') ?? ''
  const phone = phoneDigits.length === 12 && phoneDigits.startsWith('52') ? phoneDigits.slice(2) : phoneDigits
  const address = body?.customer?.address?.trim()
  if (!name || name.length < 2 || !phone || phone.length !== 10 || !address || address.length < 8) throw createError({ statusCode: 400, statusMessage: 'Completa nombre, teléfono de 10 dígitos y dirección' })
  const location = body.customer.location
  if (location && (!Number.isFinite(location.lat) || !Number.isFinite(location.lon) || Math.abs(location.lat) > 90 || Math.abs(location.lon) > 180)) throw createError({ statusCode: 400, statusMessage: 'Ubicación de entrega inválida' })
  const quote = quoteOrder(body.items, body.zoneId, body.deliveryDate, body.deliveryTime)
  const lines = body.items.map(item => {
    const product = store.products.find(product => product.id === item.productId)!
    const unitPrice = product.salePrice ?? product.price
    return { productId: item.productId, name: product.name, color: item.color, size: item.size, quantity: item.quantity, unitPrice, lineTotal: unitPrice * item.quantity }
  })
  const order: Order = {
    id: `JIREH-${Math.floor(Date.now() / 1000).toString(16).toUpperCase()}-${String(store.orders.length + 1).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
    customer: { name, phone, address, notes: body.customer.notes?.trim() ?? '', ...(location ? { location } : {}) },
    items: structuredClone(body.items), lines, zoneId: body.zoneId, zoneName: store.zones.find(zone => zone.id === body.zoneId)!.name, deliveryDate: body.deliveryDate, deliveryTime: body.deliveryTime,
    subtotal: quote.subtotal, deliveryFee: quote.deliveryFee, total: quote.total, status: 'nuevo'
  }
  for (const item of order.items) {
    const variant = store.products.find(product => product.id === item.productId)!.variants.find(variant => variant.color === item.color && variant.size === item.size)!
    variant.stock -= item.quantity
  }
  store.orders.unshift(order)
  setResponseStatus(event, 201)
  return order
})
