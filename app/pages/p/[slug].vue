<template>
  <main v-if="product" class="shell detail-page">
    <NuxtLink to="/" class="back-link">← Volver al catálogo</NuxtLink>
    <div class="detail-grid">
      <div class="product-gallery"><div :class="['detail-image', product.tone]"><img :src="selectedImage" :alt="product.name" /></div><div v-if="galleryImages.length > 1" class="gallery-thumbnails" aria-label="Perspectivas del producto"><button v-for="(image, index) in galleryImages" :key="image" type="button" :class="{ selected: selectedImage === image }" :aria-label="`Ver perspectiva ${index + 1}`" @click="selectedImage = image"><img :src="image" alt="" /></button></div></div>
      <div class="detail-content">
        <span class="eyebrow">{{ product.category.toUpperCase() }}</span>
        <h1>{{ product.name }}</h1>
        <p v-if="product.requestOnly" class="request-only-label">Modelo disponible para solicitud</p>
        <p v-else class="detail-price"><del v-if="product.salePrice">{{ money(product.price) }}</del><strong :class="{ 'sale-price': product.salePrice }">{{ money(product.salePrice ?? product.price) }}</strong><span v-if="product.salePrice" class="discount-label">Precio especial</span></p>
        <p class="detail-description">{{ product.description }}</p>
        <div class="choice-group"><h2>Color <span>{{ selectedColor }}</span></h2><div class="choice-row"><button v-for="color in product.colors" :key="color" type="button" :class="['choice', { selected: selectedColor === color }]" :aria-pressed="selectedColor === color" @click="selectColor(color)">{{ color }}</button></div></div>
        <div class="choice-group"><h2>Talla <span v-if="selectedSize">{{ selectedSize }}</span></h2><div class="choice-row"><button v-for="variant in availableSizes" :key="variant.size" type="button" :class="['size-choice', { selected: selectedSize === variant.size, 'request-size': variant.stock === 0 || product.requestOnly }]" :aria-pressed="selectedSize === variant.size" @click="selectSize(variant.size)">{{ variant.size }}</button></div><p v-if="selectedVariant" class="stock-message">{{ product.requestOnly ? 'Este modelo se atiende por solicitud.' : selectedVariant.stock ? `Disponible · quedan ${selectedVariant.stock} ${selectedVariant.stock === 1 ? 'par' : 'pares'}` : 'Sin existencias · puedes solicitar esta talla.' }}</p><p v-else class="help-text">Elige una talla para consultar o solicitar el modelo.</p></div>
        <button v-if="canOrder" :class="['button button-dark add-button', { added: addedRecently }]" type="button" @click="addToCart"><span>{{ addedRecently ? 'Agregado a tu bolsa' : 'Agregar a mi bolsa' }}</span><span aria-hidden="true">{{ addedRecently ? '✓' : '→' }}</span></button>
        <button v-if="canRequest" class="button button-dark add-button" type="button" @click="requestOpen = true">Solicitar este calzado <span aria-hidden="true">→</span></button>
        <form v-if="requestOpen && canRequest && !requestResult" class="product-request-form" @submit.prevent="submitRequest">
          <h2>Solicitar {{ product.name }}</h2>
          <p>Déjanos tus datos y consultaremos si podemos conseguir el par. Esta solicitud no reserva producto ni genera un cobro.</p>
          <div class="request-selection">{{ selectedColor }} · Talla {{ selectedSize }}</div>
          <label>Tu nombre<input v-model.trim="requestCustomer.name" type="text" autocomplete="name" required minlength="2" /></label>
          <label>Número para contactarte<input v-model="requestCustomer.phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="10 dígitos" /></label>
          <label>Comentario <span class="optional">(opcional)</span><textarea v-model.trim="requestCustomer.notes" rows="2" maxlength="500" placeholder="Por ejemplo, cuándo te gustaría recibirlo" /></label>
          <p v-if="requestError" class="form-error" role="alert">{{ requestError }}</p>
          <div class="request-actions"><button class="button button-dark" type="submit" :disabled="requestBusy">{{ requestBusy ? 'Registrando solicitud…' : 'Enviar solicitud' }}</button><button type="button" class="text-button" :disabled="requestBusy" @click="requestOpen = false">Cancelar</button></div>
        </form>
        <div v-if="requestResult" class="request-success" role="status"><strong>Solicitud registrada, {{ requestResult.customer.name }}.</strong><p>Tu folio es {{ requestResult.id }}. Nuestro equipo revisará la disponibilidad y se pondrá en contacto contigo.</p></div>
        
      </div>
    </div>
    <Transition name="toast"><aside v-if="message" :class="['cart-toast', { warning: toastWarning }]" role="status" aria-live="polite"><span class="cart-toast-icon" aria-hidden="true">{{ toastWarning ? '!' : '✓' }}</span><div><strong>{{ toastWarning ? 'Revisa tu bolsa' : '¡Producto agregado!' }}</strong><p>{{ message }}</p><NuxtLink v-if="!toastWarning" to="/carrito">Ver mi bolsa →</NuxtLink></div><button type="button" aria-label="Cerrar notificación" @click="closeToast">×</button></aside></Transition>
  </main>
  <main v-else class="shell empty-state"><h1>No encontramos ese modelo</h1><NuxtLink class="button button-dark" to="/">Volver al catálogo</NuxtLink></main>
</template>

<script setup lang="ts">
import type { Product } from '~/types/shop'
import { money } from '~/utils/money'
type ProductRequest = { id: string; customer: { name: string } }
const route = useRoute()
const { data: product } = await useFetch<Product>(() => `/api/products/${route.params.slug}`)
const galleryImages = computed(() => product.value?.images?.length ? product.value.images : product.value ? [product.value.image] : [])
const selectedImage = ref(product.value?.images?.[0] ?? product.value?.image ?? '')
const selectedColor = ref(product.value?.colors[0] ?? '')
const selectedSize = ref<number | null>(null)
const message = ref('')
const toastWarning = ref(false)
const addedRecently = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | undefined
const requestOpen = ref(false)
const requestBusy = ref(false)
const requestError = ref('')
const requestResult = ref<ProductRequest | null>(null)
const requestCustomer = reactive({ name: '', phone: '', notes: '' })
const availableSizes = computed(() => product.value?.variants.filter(v => v.color === selectedColor.value) ?? [])
const selectedVariant = computed(() => availableSizes.value.find(v => v.size === selectedSize.value))
const canOrder = computed(() => Boolean(selectedVariant.value && !product.value?.requestOnly && selectedVariant.value.stock > 0))
const canRequest = computed(() => Boolean(selectedVariant.value && (product.value?.requestOnly || selectedVariant.value.stock === 0)))
const { addItem, upsertProduct } = useShop()
watchEffect(() => { if (product.value) upsertProduct(product.value) })
function selectColor(color: string) { selectedColor.value = color; selectedSize.value = null; requestOpen.value = false; requestResult.value = null; closeToast() }
function selectSize(size: number) { selectedSize.value = size; requestOpen.value = false; requestResult.value = null; requestError.value = ''; closeToast() }
function addToCart() {
  if (!product.value || !selectedSize.value || !canOrder.value) return
  const added = addItem({ productId: product.value.id, color: selectedColor.value, size: selectedSize.value, quantity: 1 })
  toastWarning.value = !added
  addedRecently.value = added
  message.value = added ? `${product.value.name} · ${selectedColor.value} · Talla ${selectedSize.value}` : 'Ya agregaste todas las unidades disponibles de esta talla y color.'
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(closeToast, added ? 4500 : 5500)
}
function closeToast() { message.value = ''; addedRecently.value = false; if (toastTimer) clearTimeout(toastTimer); toastTimer = undefined }
async function submitRequest() {
  if (!product.value || !selectedSize.value || !canRequest.value || requestBusy.value) return
  requestBusy.value = true; requestError.value = ''
  try {
    requestResult.value = await $fetch<ProductRequest>('/api/product-requests', { method: 'POST', body: { productId: product.value.id, color: selectedColor.value, size: selectedSize.value, customer: requestCustomer } })
    requestOpen.value = false
  } catch (error) { requestError.value = (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'No se pudo registrar la solicitud. Inténtalo de nuevo.' }
  finally { requestBusy.value = false }
}
useHead(() => ({ title: product.value ? `${product.value.name} | MiPar` : 'Producto no encontrado | MiPar', meta: [{ name: 'description', content: product.value?.description ?? 'Explora el catálogo de MiPar.' }] }))
onBeforeUnmount(closeToast)
</script>
