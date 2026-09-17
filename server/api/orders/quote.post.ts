import type { CartItem } from '../../../app/types/shop'
import { quoteOrder } from '../../data/store'

type QuoteRequest = { items: CartItem[]; zoneId: string; deliveryDate: string; deliveryTime: string }
export default defineEventHandler(async event => {
  const body = await readBody<QuoteRequest>(event)
  return quoteOrder(body?.items, body?.zoneId, body?.deliveryDate, body?.deliveryTime)
})
