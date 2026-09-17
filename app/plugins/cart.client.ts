import type { CartItem } from '~/types/shop'
export default defineNuxtPlugin(() => {
  const cart = useState<CartItem[]>('cart', () => [])
  try {
    const saved = sessionStorage.getItem('mipar_cart')
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (Array.isArray(parsed)) cart.value = parsed.filter(item => item && typeof item.productId === 'string' && typeof item.color === 'string' && Number.isInteger(item.size) && Number.isInteger(item.quantity) && item.quantity > 0)
    }
  } catch { sessionStorage.removeItem('mipar_cart') }
  watch(cart, value => sessionStorage.setItem('mipar_cart', JSON.stringify(value)), { deep: true })
})
