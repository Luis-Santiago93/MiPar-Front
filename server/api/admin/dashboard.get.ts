import { requireAdmin } from '../../utils/adminAuth'
import { store } from '../../data/store'
export default defineEventHandler(event => {
  requireAdmin(event)
  const sold = store.orders.filter(order => order.status === 'vendido')
  const byDay = new Map<string, { date: string; orders: number; total: number }>()
  for (const order of sold) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(order.soldAt ?? order.createdAt))
    const part = (type: string) => parts.find(value => value.type === type)?.value ?? ''
    const date = `${part('year')}-${part('month')}-${part('day')}`
    const day = byDay.get(date) ?? { date, orders: 0, total: 0 }
    day.orders += 1; day.total += order.total; byDay.set(date, day)
  }
  return { soldCount: sold.length, soldTotal: sold.reduce((sum, order) => sum + order.total, 0), pendingCount: store.orders.filter(order => order.status !== 'vendido').length, availablePairs: store.products.reduce((sum, product) => sum + product.variants.reduce((n, variant) => n + variant.stock, 0), 0), salesByDay: [...byDay.values()].sort((a, b) => b.date.localeCompare(a.date)) }
})
