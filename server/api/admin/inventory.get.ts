import { requireAdmin } from '../../utils/adminAuth'
import { store } from '../../data/store'
export default defineEventHandler(event => {
  requireAdmin(event)
  return store.products.flatMap(product => product.variants.map(variant => ({ productId: product.id, productName: product.name, image: product.image, color: variant.color, size: variant.size, stock: variant.stock })))
})
