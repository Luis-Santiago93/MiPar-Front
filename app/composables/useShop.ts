import type { CartItem, Product } from '~/types/shop'

export const useShop = () => {
  const cart = useState<CartItem[]>('cart', () => [])
  const products = useState<Product[]>('products', () => [])
  const getProduct = (id: string) => products.value.find(product => product.id === id)
  const setProducts = (items: Product[]) => { products.value = items }
  const upsertProduct = (item: Product) => { products.value = [...products.value.filter(product => product.id !== item.id), item] }
  const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() => cart.value.reduce((sum, item) => { const product = getProduct(item.productId); return sum + (product?.salePrice ?? product?.price ?? 0) * item.quantity }, 0))
  function addItem(item: CartItem) {
    const product = getProduct(item.productId)
    const stock = product?.variants.find(v => v.color === item.color && v.size === item.size)?.stock ?? 0
    const existing = cart.value.find(v => v.productId === item.productId && v.color === item.color && v.size === item.size)
    if (!stock || (existing?.quantity ?? 0) + item.quantity > stock) return false
    cart.value = existing ? cart.value.map(v => v === existing ? { ...v, quantity: v.quantity + item.quantity } : v) : [...cart.value, item]
    return true
  }
  function removeItem(item: CartItem) { cart.value = cart.value.filter(v => !(v.productId === item.productId && v.color === item.color && v.size === item.size)) }
  function setQuantity(item: CartItem, quantity: number) {
    const stock = getProduct(item.productId)?.variants.find(v => v.color === item.color && v.size === item.size)?.stock ?? 0
    if (quantity < 1) removeItem(item)
    else if (quantity <= stock) cart.value = cart.value.map(v => v === item ? { ...v, quantity } : v)
  }
  return { cart, products, cartCount, subtotal, getProduct, setProducts, upsertProduct, addItem, removeItem, setQuantity }
}
