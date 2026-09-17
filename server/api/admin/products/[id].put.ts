import type { Product } from '../../../../app/types/shop'
import { store } from '../../../data/store'
import { requireAdmin } from '../../../utils/adminAuth'
export default defineEventHandler(async event => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  const body = await readBody<Product>(event)
  const images = [...new Set((body.images?.length ? body.images : [body.image]).map(image => image?.trim()).filter(Boolean))]
  const salePrice = body.salePrice ? Number(body.salePrice) : null
  if (!/^[a-z0-9-]{3,60}$/.test(id) || body?.id !== id || !body.name?.trim() || !body.category?.trim() || !Number.isFinite(body.price) || body.price < 0 || (!body.requestOnly && body.price === 0) || (salePrice !== null && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= body.price)) || images.length === 0 || !Array.isArray(body.variants) || body.variants.length === 0) throw createError({ statusCode: 400, statusMessage: 'Completa los datos del producto y revisa el precio especial' })
  const keys = new Set<string>()
  for (const variant of body.variants) {
    const key = `${variant.color}:${variant.size}`
    if (!variant.color?.trim() || !Number.isInteger(variant.size) || variant.size < 1 || !Number.isInteger(variant.stock) || variant.stock < 0 || keys.has(key)) throw createError({ statusCode: 400, statusMessage: 'Revisa las variantes y existencias' })
    keys.add(key)
  }
  const product: Product = { id, name: body.name.trim(), category: body.category.trim(), price: body.price, salePrice, description: body.description?.trim() ?? '', image: images[0]!, images, tone: body.tone || 'sand', badge: body.badge?.trim() || undefined, requestOnly: Boolean(body.requestOnly), variants: body.variants, colors: [...new Set(body.variants.map(variant => variant.color))] }
  const index = store.products.findIndex(item => item.id === id)
  if (index < 0) store.products.push(product)
  else store.products[index] = product
  return product
})
