import { store } from '../../data/store'
export default defineEventHandler(event => {
  const product = store.products.find(item => item.id === getRouterParam(event, 'slug'))
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado' })
  return product
})
