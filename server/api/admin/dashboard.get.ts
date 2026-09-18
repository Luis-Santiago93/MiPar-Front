import { requireAdmin } from '../../utils/adminAuth'
import { store } from '../../data/store'
export default defineEventHandler(event => {
  requireAdmin(event)
  const sold = store.orders.filter(order => order.status === 'vendido')
  const byDay = new Map<string, { date: string; orders: number; pairs: number; total: number }>()
  const payments = new Map<string, { method: string; orders: number; total: number }>()
  const products = new Map<string, { productId: string; name: string; pairs: number; total: number }>()
  let soldPairs = 0
  for (const order of sold) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(order.soldAt ?? order.createdAt))
    const part = (type: string) => parts.find(value => value.type === type)?.value ?? ''
    const date = `${part('year')}-${part('month')}-${part('day')}`
    const pairs = order.lines.reduce((sum, line) => sum + line.quantity, 0)
    soldPairs += pairs
    const day = byDay.get(date) ?? { date, orders: 0, pairs: 0, total: 0 }
    day.orders += 1; day.pairs += pairs; day.total += order.total; byDay.set(date, day)
    const payment = payments.get(order.paymentMethod) ?? { method: order.paymentMethod, orders: 0, total: 0 }
    payment.orders += 1; payment.total += order.total; payments.set(order.paymentMethod, payment)
    for (const line of order.lines) {
      const product = products.get(line.productId) ?? { productId: line.productId, name: line.name, pairs: 0, total: 0 }
      product.pairs += line.quantity; product.total += line.lineTotal; products.set(line.productId, product)
    }
  }
  const soldTotal = sold.reduce((sum, order) => sum + order.total, 0)
  return { soldCount: sold.length, soldTotal, soldPairs, averageTicket: sold.length ? soldTotal / sold.length : 0, pendingCount: store.orders.filter(order => order.status !== 'vendido').length, availablePairs: store.products.reduce((sum, product) => sum + product.variants.reduce((n, variant) => n + variant.stock, 0), 0), salesByDay: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)), payments: [...payments.values()].sort((a, b) => b.total - a.total), topProducts: [...products.values()].sort((a, b) => b.pairs - a.pairs).slice(0, 5) }
})
