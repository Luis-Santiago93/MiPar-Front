<template>
  <main class="shell delivery-page">
    <NuxtLink v-if="!order && !quote" to="/carrito" class="back-link">← Volver a mi bolsa</NuxtLink>
    <div v-if="!order && !quote" class="section-heading"><div><span class="eyebrow">DATOS DE ENTREGA</span><h1>¿Dónde te entregamos?</h1></div></div>
    <section v-if="order" class="order-confirmation" aria-labelledby="confirmation-title">
      <span class="eyebrow">PEDIDO REGISTRADO</span>
      <h1 id="confirmation-title">¡Listo, {{ order.customer.name }}!</h1>
      <p class="confirmation-intro">Tu folio es <strong>{{ order.id }}</strong>. Pronto nos pondremos en contacto contigo para coordinar tu entrega.</p>
      <div class="receipt-section"><h2>Tu pedido</h2><div v-for="line in order.lines" :key="`${line.productId}-${line.color}-${line.size}`" class="receipt-line"><div><strong>{{ line.name }}</strong><span>{{ line.color }} · Talla {{ line.size }} · {{ line.quantity }} {{ line.quantity === 1 ? 'par' : 'pares' }} × {{ money(line.unitPrice) }}</span></div><strong>{{ money(line.lineTotal) }}</strong></div></div>
      <div class="receipt-section"><h2>Datos de entrega</h2><div class="receipt-detail"><span>Nombre</span><strong>{{ order.customer.name }}</strong></div><div class="receipt-detail"><span>Teléfono</span><strong>{{ order.customer.phone }}</strong></div><div class="receipt-detail"><span>Dirección</span><strong>{{ order.customer.address }}</strong></div><div v-if="order.customer.location" class="receipt-detail"><span>Punto en mapa</span><a :href="`https://www.openstreetmap.org/?mlat=${order.customer.location.lat}&mlon=${order.customer.location.lon}#map=17/${order.customer.location.lat}/${order.customer.location.lon}`" target="_blank" rel="noopener noreferrer">Ver ubicación ↗</a></div><div v-if="order.customer.notes" class="receipt-detail"><span>Indicaciones</span><strong>{{ order.customer.notes }}</strong></div><div class="receipt-detail"><span>Zona</span><strong>{{ order.zoneName }}</strong></div><div class="receipt-detail"><span>Fecha y hora</span><strong>{{ formatDate(order.deliveryDate) }} · {{ order.deliveryTime }}</strong></div></div>
      <div class="receipt-section receipt-totals"><div class="receipt-detail"><span>Subtotal</span><strong>{{ money(order.subtotal) }}</strong></div><div class="receipt-detail"><span>Entrega</span><strong>{{ money(order.deliveryFee) }}</strong></div><div class="receipt-detail receipt-total"><span>Total</span><strong>{{ money(order.total) }}</strong></div></div>
      <p class="app-note">Nuestro equipo se pondrá en contacto contigo para coordinar la entrega.</p>
      <NuxtLink to="/" class="button button-dark">Volver al catálogo</NuxtLink>
    </section>
    <section v-else-if="quote" class="order-confirmation review-section" aria-labelledby="review-title"><span class="eyebrow">REVISA TU PEDIDO</span><h1 id="review-title">Confirma los detalles</h1><div class="receipt-section"><h2>Tus productos</h2><div v-for="item in cart" :key="`${item.productId}-${item.color}-${item.size}`" class="receipt-line"><div><strong>{{ getProduct(item.productId)?.name }}</strong><span>{{ item.color }} · Talla {{ item.size }} · {{ item.quantity }} × {{ money(getProduct(item.productId)?.salePrice ?? getProduct(item.productId)?.price ?? 0) }}</span></div><strong>{{ money((getProduct(item.productId)?.salePrice ?? getProduct(item.productId)?.price ?? 0) * item.quantity) }}</strong></div></div><div class="receipt-section"><h2>Entrega</h2><div class="receipt-detail"><span>Contacto</span><strong>{{ customer.name }} · {{ customer.phone }}</strong></div><div class="receipt-detail"><span>Dirección</span><strong>{{ customer.address }}</strong></div><div v-if="deliveryPoint" class="receipt-detail"><span>Punto en mapa</span><strong>{{ deliveryPoint.lat.toFixed(6) }}, {{ deliveryPoint.lon.toFixed(6) }}</strong></div><div v-if="customer.notes" class="receipt-detail"><span>Indicaciones</span><strong>{{ customer.notes }}</strong></div><div class="receipt-detail"><span>Zona, fecha y hora</span><strong>{{ selectedZone?.name }} · {{ selectedZone?.dates.find(day => day.date === deliveryDate)?.label }} · {{ deliveryTime }}</strong></div></div><div class="receipt-section receipt-totals"><div class="receipt-detail"><span>Subtotal</span><strong>{{ money(quote.subtotal) }}</strong></div><div class="receipt-detail"><span>Envío</span><strong>{{ money(quote.deliveryFee) }}</strong></div><div class="receipt-detail receipt-total"><span>Total</span><strong>{{ money(quote.total) }}</strong></div></div><p class="app-note">Al confirmar se registrará tu pedido y se actualizarán las existencias.</p><p v-if="orderError" class="form-error" role="alert">{{ orderError }}</p><div class="review-actions"><button class="button button-dark confirm-order-button" type="button" :disabled="loading" :aria-busy="loading" @click="placeOrder"><span v-if="loading" class="shoe-loader" aria-hidden="true">👟</span><span>{{ loading ? 'Generando solicitud…' : 'Confirmar pedido' }}</span></button><button class="text-button" type="button" :disabled="loading" @click="quote = null">Editar datos de entrega</button><p v-if="loading" class="order-loading-message" role="status" aria-live="polite">Estamos registrando tu pedido y preparando tu folio…</p></div></section>
    <div v-else-if="!cart.length" class="empty-state"><p>Primero agrega un par a tu bolsa.</p><NuxtLink to="/" class="button button-dark">Explorar catálogo</NuxtLink></div>
    <div v-else class="delivery-grid">
      <div class="delivery-form">
        <label for="zone">Zona de entrega</label>
        <select id="zone" v-model="zoneId"><option value="">Selecciona una zona</option><option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.name }}</option></select>
        <template v-if="selectedZone?.available">
          <div class="coverage">✓ Entrega disponible · {{ money(selectedZone.fee) }} de envío</div>
          <label for="date">Fecha disponible</label>
          <select id="date" v-model="deliveryDate"><option value="">Selecciona una fecha</option><option v-for="day in selectedZone.dates" :key="day.date" :value="day.date">{{ day.label }}</option></select>
          <label for="delivery-time">Hora de entrega</label>
          <select id="delivery-time" v-model="deliveryTime"><option value="">Selecciona una hora</option><option v-for="time in selectedZone.deliveryTimes" :key="time" :value="time">{{ time }}</option></select>
        </template>
        <p v-else-if="selectedZone" class="unavailable">Aún no hacemos entrega directa en esta zona.</p>
        <label for="customer-name">Tu nombre</label><input id="customer-name" v-model.trim="customer.name" type="text" autocomplete="name" required placeholder="Nombre completo" />
        <label for="customer-phone">Número para contactarte</label><input id="customer-phone" v-model="customer.phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required placeholder="10 dígitos, con o sin +52" />
        <div class="location-picker"><div class="location-picker-heading"><strong>Ubicación de entrega</strong><button type="button" class="text-button" :disabled="locating" @click="useCurrentLocation">{{ locating ? 'Buscando ubicación…' : 'Usar mi ubicación actual' }}</button></div><p class="help-text">Toca el mapa para marcar dónde quieres recibir tu pedido.</p><DeliveryMap :point="deliveryPoint" @pick="selectPoint" /><p v-if="locationError" class="location-error" role="alert">{{ locationError }}</p><p v-if="deliveryPoint" class="location-caption" role="status"><strong>Ubicación marcada:</strong> {{ resolvingAddress ? 'Buscando dirección…' : mapAddress }}</p><small class="map-attribution">Direcciones aproximadas: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap colaboradores</a>. Verifica el número y la colonia.</small></div>
        <label for="customer-address">Dirección de entrega</label><textarea id="customer-address" v-model.trim="customer.address" rows="3" autocomplete="street-address" required placeholder="Calle, número, colonia y referencias" />
        <label for="customer-notes">Indicaciones adicionales <span class="optional">(opcional)</span></label><textarea id="customer-notes" v-model.trim="customer.notes" rows="2" placeholder="Ej. fachada azul" />
      </div>
      <aside class="order-summary">
        <h2>Tu pedido</h2>
        <div class="summary-line"><span>{{ cartCount }} {{ cartCount === 1 ? 'par' : 'pares' }}</span><strong>{{ money(subtotal) }}</strong></div>
        <div class="summary-line"><span>Entrega</span><strong>{{ selectedZone?.available ? money(selectedZone.fee) : '—' }}</strong></div>
        <div class="summary-line total"><span>Total estimado</span><strong>{{ money(subtotal + (selectedZone?.available ? selectedZone.fee : 0)) }}</strong></div>
        <button class="button button-dark" type="button" :disabled="loading" @click="getQuote">{{ loading ? 'Calculando…' : 'Revisar pedido' }} <span aria-hidden="true">→</span></button>
        <p v-if="quoteError" role="alert">{{ quoteError }}</p><small>Al confirmar se generará tu folio.</small>
      </aside>
    </div>
  </main>
</template>
<script setup lang="ts">
import type { Product } from '~/types/shop'
import { money } from '~/utils/money'
type Zone = { id: string; name: string; fee: number; available: boolean; dates: { date: string; label: string }[]; deliveryTimes: string[] }
type Quote = { subtotal: number; deliveryFee: number; total: number; currency: string; deliveryTime: string; simulated: boolean }
type Order = Quote & { id: string; zoneName: string; deliveryDate: string; customer: { name: string; phone: string; address: string; notes: string; location?: { lat: number; lon: number } }; lines: { productId: string; name: string; color: string; size: number; quantity: number; unitPrice: number; lineTotal: number }[] }
const formatDate = (value: string) => new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00`))
const { cart, cartCount, subtotal, setProducts, getProduct } = useShop()
const [{ data: products }, { data: zonesData }] = await Promise.all([useFetch<Product[]>('/api/products'), useFetch<Zone[]>('/api/delivery/zones')])
watchEffect(() => { if (products.value) setProducts(products.value) })
const zones = computed(() => zonesData.value ?? [])
const zoneId = ref('')
const deliveryDate = ref('')
const deliveryTime = ref('')
const selectedZone = computed(() => zones.value.find(zone => zone.id === zoneId.value))
const quote = ref<Quote | null>(null)
const quoteError = ref('')
const loading = ref(false)
const customer = reactive({ name: '', phone: '', address: '', notes: '' })
const order = ref<Order | null>(null)
const orderError = ref('')
type DeliveryPoint = { lat: number; lon: number }
type ReverseAddress = { address?: string | Record<string, string>; displayName?: string }
const deliveryPoint = ref<DeliveryPoint | null>(null)
const mapAddress = ref('')
const locationError = ref('')
const locating = ref(false)
const resolvingAddress = ref(false)
let reverseTimer: ReturnType<typeof setTimeout> | undefined
let reverseController: AbortController | undefined
let reverseRequest = 0

function selectPoint(point: DeliveryPoint) {
  const addressAtSelection = customer.address
  deliveryPoint.value = point
  locationError.value = ''
  mapAddress.value = `${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`
  resolvingAddress.value = true
  if (reverseTimer) clearTimeout(reverseTimer)
  reverseController?.abort()
  const request = ++reverseRequest
  reverseTimer = setTimeout(async () => {
    reverseController = new AbortController()
    try {
      const params = new URLSearchParams({ lat: String(point.lat), lon: String(point.lon) })
      const response = await fetch(`/api/location/reverse?${params}`, { signal: reverseController.signal })
      if (!response.ok) throw new Error('Dirección no disponible')
      const result = await response.json() as ReverseAddress
      if (request !== reverseRequest) return
      const readableAddress = result.displayName || (typeof result.address === 'string' ? result.address : formatAddress(result.address))
      if (readableAddress) {
        mapAddress.value = readableAddress
        if (customer.address === addressAtSelection) customer.address = readableAddress
      } else locationError.value = 'No encontramos una dirección para ese punto. Escríbela abajo.'
    } catch (error) {
      if (request === reverseRequest && !(error instanceof DOMException && error.name === 'AbortError')) locationError.value = 'No pudimos obtener la dirección del mapa. Escríbela abajo.'
    } finally {
      if (request === reverseRequest) resolvingAddress.value = false
    }
  }, 1100)
}

function formatAddress(address?: Record<string, string>) {
  if (!address) return ''
  const street = [address.road, address.house_number].filter(Boolean).join(' ')
  return [...new Set([street, address.neighbourhood || address.suburb, address.postcode, address.city || address.town || address.village || address.county, address.state, address.country].filter(Boolean))].join(', ')
}

function useCurrentLocation() {
  locationError.value = ''
  if (!navigator.geolocation) { locationError.value = 'Este navegador no permite obtener tu ubicación. Marca un punto en el mapa.'; return }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    position => { locating.value = false; selectPoint({ lat: position.coords.latitude, lon: position.coords.longitude }) },
    () => { locating.value = false; locationError.value = 'No pudimos obtener tu ubicación. Permite el acceso o marca un punto en el mapa.' },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  )
}
onBeforeUnmount(() => { if (reverseTimer) clearTimeout(reverseTimer); reverseController?.abort() })
function validateCheckout() {
  if (!selectedZone.value) return 'Selecciona una zona de entrega.'
  if (!selectedZone.value.available) return 'Esta zona está fuera de cobertura. Elige otra zona.'
  if (!deliveryDate.value) return 'Selecciona una fecha de entrega.'
  if (!deliveryTime.value) return 'Selecciona una hora de entrega.'
  if (customer.name.trim().length < 2) return 'Escribe tu nombre completo.'
  const digits = customer.phone.replace(/\D/g, '')
  if (!(digits.length === 10 || (digits.length === 12 && digits.startsWith('52')))) return 'Escribe un teléfono de 10 dígitos; también puedes usar +52.'
  if (customer.address.trim().length < 8) return 'Escribe la dirección completa de entrega.'
  return ''
}
watch(zoneId, () => { deliveryDate.value = ''; deliveryTime.value = ''; quote.value = null; quoteError.value = '' })
async function getQuote() {
  quoteError.value = validateCheckout()
  if (quoteError.value) return
  loading.value = true; quoteError.value = ''; quote.value = null
  try { quote.value = await $fetch<Quote>('/api/orders/quote', { method: 'POST', body: { items: cart.value, zoneId: zoneId.value, deliveryDate: deliveryDate.value, deliveryTime: deliveryTime.value } }) }
  catch (error) { quoteError.value = (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'No pudimos calcular el total. Revisa la talla, cantidad y fecha elegidas.' }
  finally { loading.value = false }
}
async function placeOrder() {
  if (loading.value || !quote.value || order.value) return
  loading.value = true; orderError.value = ''
  const startedAt = Date.now()
  try {
    await nextTick()
    const registeredOrder = await $fetch<Order>('/api/orders', { method: 'POST', body: { items: cart.value, zoneId: zoneId.value, deliveryDate: deliveryDate.value, deliveryTime: deliveryTime.value, customer: { ...customer, ...(deliveryPoint.value ? { location: deliveryPoint.value } : {}) } } })
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 1600 - (Date.now() - startedAt))))
    order.value = registeredOrder
    cart.value = []
    quote.value = null
  } catch (error) { orderError.value = (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'No pudimos registrar el pedido. Revisa existencias y vuelve a intentarlo.' }
  finally { loading.value = false }
}
useHead({ title: 'Entrega | MiPar' })
</script>
