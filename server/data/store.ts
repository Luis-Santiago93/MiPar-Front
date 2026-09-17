import type { CartItem, Product } from '../../app/types/shop'
import { products as seedProducts } from './products'
import { zones as seedZones, nextDates, type DeliveryZone } from './delivery'

export type OrderStatus = 'nuevo' | 'confirmado' | 'vendido'
export type OrderLine = { productId: string; name: string; color: string; size: number; quantity: number; unitPrice: number; lineTotal: number }
export type Order = { id: string; createdAt: string; soldAt?: string; customer: { name: string; phone: string; address: string; notes: string; location?: { lat: number; lon: number } }; items: CartItem[]; lines: OrderLine[]; zoneId: string; zoneName: string; deliveryDate: string; deliveryTime: string; subtotal: number; deliveryFee: number; total: number; status: OrderStatus }
export type ProductRequest = { id: string; createdAt: string; productId: string; productName: string; color: string; size: number; customer: { name: string; phone: string; notes: string }; status: 'nueva' | 'contactada' | 'cerrada' }
export const store: { products: Product[]; zones: DeliveryZone[]; orders: Order[]; productRequests: ProductRequest[] } = {
  products: structuredClone(seedProducts), zones: structuredClone(seedZones), orders: [], productRequests: []
}

export function quoteOrder(items: CartItem[], zoneId: string, deliveryDate: string, deliveryTime: string) {
  if (!Array.isArray(items) || items.length === 0) throw createError({ statusCode: 400, statusMessage: 'Agrega al menos un producto' })
  const zone = store.zones.find(item => item.id === zoneId && item.available)
  if (!zone) throw createError({ statusCode: 400, statusMessage: 'Zona de entrega no disponible' })
  if (!nextDates(zone.weekdays).some(day => day.date === deliveryDate)) throw createError({ statusCode: 400, statusMessage: 'Fecha de entrega no disponible' })
  if (!zone.deliveryTimes.includes(deliveryTime)) throw createError({ statusCode: 400, statusMessage: 'Hora de entrega no disponible' })
  let subtotal = 0
  const requested = new Map<string, number>()
  for (const item of items) {
    const product = store.products.find(product => product.id === item.productId)
    const variant = product?.variants.find(v => v.color === item.color && v.size === item.size)
    if (!product || product.requestOnly || !variant || !Number.isInteger(item.quantity) || item.quantity < 1) throw createError({ statusCode: 400, statusMessage: 'Variante o cantidad inválida' })
    const key = `${item.productId}:${item.color}:${item.size}`
    const quantity = (requested.get(key) ?? 0) + item.quantity
    if (quantity > variant.stock) throw createError({ statusCode: 400, statusMessage: 'Existencias insuficientes' })
    requested.set(key, quantity)
    subtotal += (product.salePrice ?? product.price) * item.quantity
  }
  return { subtotal, deliveryFee: zone.fee, total: subtotal + zone.fee, currency: 'MXN', zoneId, deliveryDate, deliveryTime, simulated: true }
}
