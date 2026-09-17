export type Variant = { color: string; size: number; stock: number }
export type Product = { id: string; name: string; category: string; price: number; salePrice?: number | null; description: string; colors: string[]; variants: Variant[]; image: string; images: string[]; tone: string; badge?: string; requestOnly?: boolean }
export type CartItem = { productId: string; color: string; size: number; quantity: number }
