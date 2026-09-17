<template>
  <main class="shell admin-page">
    <div class="admin-heading"><div><span class="eyebrow">MIPAR · BACKOFFICE</span><h1>Backoffice</h1><p>Administra productos, almacén y ventas desde aquí.</p></div><div class="admin-heading-actions"><NuxtLink to="/" class="button button-dark">Ver tienda ↗</NuxtLink><button type="button" class="text-button" @click="logout">Cerrar sesión</button></div></div>
    <div class="admin-tabs" role="tablist" aria-label="Secciones del backoffice"><button v-for="item in tabs" :key="item.id" type="button" role="tab" :aria-selected="tab === item.id" :class="{ active: tab === item.id }" @click="tab = item.id">{{ item.label }}</button></div>

    <section v-if="tab === 'dashboard'" class="dashboard-section"><div class="metric-grid"><div class="metric-card"><span>Ventas concretadas</span><strong>{{ dashboard?.soldCount ?? 0 }}</strong></div><div class="metric-card"><span>Total vendido</span><strong>{{ money(dashboard?.soldTotal ?? 0) }}</strong></div><div class="metric-card"><span>Pedidos pendientes</span><strong>{{ dashboard?.pendingCount ?? 0 }}</strong></div><div class="metric-card"><span>Pares disponibles</span><strong>{{ dashboard?.availablePairs ?? 0 }}</strong></div></div><div class="admin-list-title"><h2>Ventas por día</h2><button type="button" class="text-button" @click="reloadDashboard">Actualizar</button></div><p v-if="!dashboard?.salesByDay.length" class="admin-empty">Aún no hay ventas concretadas. Marca un pedido como vendido para verlo aquí.</p><div v-else class="daily-sales"><div v-for="day in dashboard.salesByDay" :key="day.date" class="daily-sales-row"><strong>{{ day.date }}</strong><span>{{ day.orders }} {{ day.orders === 1 ? 'venta' : 'ventas' }}</span><strong>{{ money(day.total) }}</strong></div></div></section>

    <section v-if="tab === 'inventory'" class="admin-orders"><div class="admin-list-title"><h2>Existencias por zapato</h2><button type="button" class="text-button" @click="() => refreshInventory()">Actualizar</button></div><p class="help-text">Los pedidos registrados descuentan las existencias disponibles. Al marcar una venta como concretada no se descuentan por segunda vez.</p><div class="inventory-table"><div class="inventory-head"><strong>Modelo</strong><strong>Color</strong><strong>Talla</strong><strong>Disponible</strong></div><div v-for="item in inventory ?? []" :key="`${item.productId}-${item.color}-${item.size}`" class="inventory-row"><span>{{ item.productName }}</span><span>{{ item.color }}</span><span>{{ item.size }}</span><strong :class="{ 'low-stock': item.stock < 2 }">{{ item.stock }} {{ item.stock === 1 ? 'par' : 'pares' }}</strong></div></div></section>

    <section v-if="tab === 'products'" class="admin-layout">
      <div class="admin-list"><div class="admin-list-title"><h2>Productos</h2><button type="button" class="text-button" @click="newProduct">+ Nuevo</button></div><button v-for="item in products ?? []" :key="item.id" type="button" class="admin-list-item" :class="{ selected: productForm?.id === item.id }" @click="editProduct(item)"><img :src="item.image" :alt="item.name" /><span><strong>{{ item.name }}</strong><small>{{ item.requestOnly ? 'Solo solicitud' : money(item.salePrice ?? item.price) }} · {{ item.variants.reduce((sum, v) => sum + v.stock, 0) }} pares</small></span></button></div>
      <form v-if="productForm" class="admin-editor" @submit.prevent="saveProduct"><h2>{{ isNewProduct ? 'Nuevo producto' : 'Editar producto' }}</h2><div class="admin-fields"><label>Identificador <input v-model.trim="productForm.id" required pattern="[a-z0-9-]{3,60}" :readonly="!isNewProduct" :class="{ 'readonly-input': !isNewProduct }" placeholder="ej. tenis-azul" /><small v-if="!isNewProduct">El identificador no cambia después de crear el producto.</small></label><label>Nombre <input ref="productNameInput" v-model.trim="productForm.name" required /></label><label>Categoría <input v-model.trim="productForm.category" required /></label><label>Precio normal (MXN) <input v-model.number="productForm.price" type="number" :min="productForm.requestOnly ? 0 : 1" step="1" required /></label><label>Precio especial (opcional) <input v-model.number="productForm.salePrice" type="number" min="1" :max="Math.max(1, productForm.price - 1)" step="1" placeholder="Déjalo vacío sin descuento" /><small>Debe ser menor al precio normal.</small></label><label class="check-label"><input v-model="productForm.requestOnly" type="checkbox" /> Mostrar solo para solicitud, sin venta directa</label><label class="wide">Descripción <textarea v-model.trim="productForm.description" rows="3" /></label><label class="wide">Subir perspectivas <input type="file" multiple accept="image/jpeg,image/png,image/webp" @change="chooseImages" /><small>Selecciona varias imágenes. La primera será la portada. Máximo 5 MB por imagen.</small></label><label>Etiqueta <input v-model.trim="productForm.badge" placeholder="Nuevo (opcional)" /></label><label>Fondo <select v-model="productForm.tone"><option value="sand">Arena</option><option value="blue">Azul</option><option value="rose">Rosa</option><option value="lilac">Lila</option></select></label></div><div class="admin-image-gallery"><div v-for="(image, index) in productForm.images" :key="image" class="admin-image-item"><img :src="image" :alt="`Perspectiva ${index + 1}`" /><strong>{{ index === 0 ? 'Portada' : `Imagen ${index + 1}` }}</strong><button v-if="index > 0" type="button" class="text-button" @click="makeCover(index)">Hacer portada</button><button type="button" class="text-button danger" @click="removeImage(index)">Eliminar</button></div></div><div class="admin-list-title"><h3>Colores, tallas y existencias</h3><button type="button" class="text-button" @click="productForm.variants.push({ color: '', size: 25, stock: 0 })">+ Variante</button></div><div v-for="(variant, index) in productForm.variants" :key="index" class="variant-row"><input v-model.trim="variant.color" aria-label="Color" placeholder="Color" required /><input v-model.number="variant.size" aria-label="Talla" type="number" min="1" step="0.5" required /><input v-model.number="variant.stock" aria-label="Existencias" type="number" min="0" step="1" required /><button type="button" aria-label="Quitar variante" @click="productForm.variants.splice(index, 1)">×</button></div><p v-if="message" class="admin-message" role="status">{{ message }}</p><div class="admin-actions"><button type="submit" class="button button-dark" :disabled="busy">Guardar producto</button><button v-if="!isNewProduct" type="button" class="text-button danger" @click="askDeleteProduct">Eliminar</button></div></form>
    </section>

    <section v-if="tab === 'zones'" class="admin-layout"><div class="admin-list"><div class="admin-list-title"><h2>Zonas</h2><button type="button" class="text-button" @click="newZone">+ Nueva</button></div><button v-for="item in zones ?? []" :key="item.id" type="button" class="admin-list-item" :class="{ selected: zoneForm?.id === item.id }" @click="editZone(item)"><span><strong>{{ item.name }}</strong><small>{{ item.available ? `Entrega ${money(item.fee)}` : 'Sin cobertura' }}</small></span></button></div><form v-if="zoneForm" class="admin-editor" @submit.prevent="saveZone"><h2>Configurar zona</h2><div class="admin-fields"><label>Identificador <input v-model.trim="zoneForm.id" required pattern="[a-z0-9-]{2,60}" :disabled="!isNewZone" /></label><label>Nombre <input v-model.trim="zoneForm.name" required /></label><label>Costo de entrega <input v-model.number="zoneForm.fee" type="number" min="0" required /></label><label class="check-label"><input v-model="zoneForm.available" type="checkbox" /> Entrega disponible</label></div><h3>Días de entrega</h3><div class="weekday-list"><label v-for="day in weekdays" :key="day.value"><input v-model="zoneForm.weekdays" type="checkbox" :value="day.value" /> {{ day.label }}</label></div><div class="admin-list-title"><h3>Horas de entrega</h3><button type="button" class="text-button" @click="zoneForm.deliveryTimes.push('12:00')">+ Hora</button></div><div v-for="(time, index) in zoneForm.deliveryTimes" :key="index" class="time-slot-row"><label>Hora puntual <input v-model="zoneForm.deliveryTimes[index]" type="time" required /></label><button type="button" aria-label="Quitar hora" @click="zoneForm.deliveryTimes.splice(index, 1)">×</button></div><p v-if="message" class="admin-message" role="status">{{ message }}</p><div class="admin-actions"><button type="submit" class="button button-dark" :disabled="busy">Guardar zona</button><button v-if="!isNewZone" type="button" class="text-button danger" @click="askDeleteZone">Eliminar zona</button></div></form></section>

    <section v-if="tab === 'orders'" class="admin-orders"><div class="admin-list-title"><h2>Pedidos</h2><button type="button" class="text-button" @click="() => refreshOrders()">Actualizar</button></div><p v-if="!orders?.length" class="admin-empty">Todavía no hay pedidos. Confirma uno desde la tienda para verlo aquí.</p><article v-for="item in orders ?? []" :key="item.id" class="admin-order"><div><strong>{{ item.id }}</strong><small>{{ new Date(item.createdAt).toLocaleString('es-MX') }}</small></div><div><strong>{{ item.customer.name }}</strong><small>{{ item.customer.phone }} · {{ item.customer.address }}</small><small v-if="item.customer.notes">{{ item.customer.notes }}</small><a v-if="item.customer.location" class="admin-map-link" :href="`https://www.openstreetmap.org/?mlat=${item.customer.location.lat}&mlon=${item.customer.location.lon}#map=17/${item.customer.location.lat}/${item.customer.location.lon}`" target="_blank" rel="noopener noreferrer">Ver punto de entrega ↗</a></div><div><strong>{{ money(item.total) }}</strong><small>{{ item.zoneId }} · {{ item.deliveryDate }} · {{ item.deliveryTime }}</small><small v-for="line in item.items" :key="`${line.productId}-${line.color}-${line.size}`">{{ line.quantity }}× {{ line.productId }} · {{ line.color }} · {{ line.size }}</small></div><label>Estado <strong v-if="item.status === 'vendido'">Vendido · venta concretada</strong><select v-else :value="item.status" @change="changeStatus(item.id, ($event.target as HTMLSelectElement).value)"><option value="nuevo">Nuevo</option><option value="confirmado">Confirmado</option><option value="vendido">Vendido</option></select><button v-if="item.status !== 'vendido'" type="button" class="sell-button" @click="markSold(item.id)">Concretar venta</button></label></article><p v-if="message" class="admin-message" role="status">{{ message }}</p></section>
    <section v-if="tab === 'requests'" class="admin-orders"><div class="admin-list-title"><h2>Solicitudes de calzado</h2><button type="button" class="text-button" @click="() => refreshRequests()">Actualizar</button></div><p class="help-text">Son consultas de disponibilidad, no pedidos ni ventas. No descuentan existencias.</p><p v-if="!requests?.length" class="admin-empty">Todavía no hay solicitudes de modelos o tallas agotadas.</p><article v-for="item in requests ?? []" :key="item.id" class="admin-order request-admin-row"><div><strong>{{ item.id }}</strong><small>{{ new Date(item.createdAt).toLocaleString('es-MX') }}</small></div><div><strong>{{ item.productName }}</strong><small>{{ item.color }} · Talla {{ item.size }}</small><small>{{ item.customer.name }} · {{ item.customer.phone }}</small><small v-if="item.customer.notes">{{ item.customer.notes }}</small></div><label>Seguimiento <select :value="item.status" @change="changeRequestStatus(item.id, ($event.target as HTMLSelectElement).value as ProductRequest['status'])"><option value="nueva">Nueva</option><option value="contactada">Contactada</option><option value="cerrada">Cerrada</option></select></label></article><p v-if="message" class="admin-message" role="status">{{ message }}</p></section>
    <div v-if="zoneDeleteCandidate" class="modal-backdrop" role="presentation" @click.self="cancelDeleteZone"><section class="delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-zone-title"><span class="delete-modal-icon" aria-hidden="true">×</span><h2 id="delete-zone-title">Eliminar zona</h2><p>¿Quieres eliminar <strong>{{ zoneDeleteCandidate.name }}</strong>?</p><small>No podrás eliminarla si ya está vinculada a algún pedido.</small><div class="delete-modal-actions"><button type="button" class="button button-danger" :disabled="zoneDeleteBusy" @click="deleteZone">{{ zoneDeleteBusy ? 'Eliminando…' : 'Sí, eliminar' }}</button><button type="button" class="button button-light" :disabled="zoneDeleteBusy" @click="cancelDeleteZone">Cancelar</button></div></section></div>
    <div v-if="deleteCandidate" class="modal-backdrop" role="presentation" @click.self="cancelDelete"><section class="delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span class="delete-modal-icon" aria-hidden="true">×</span><h2 id="delete-title">Eliminar producto</h2><p>¿Quieres eliminar <strong>{{ deleteCandidate.name }}</strong> del catálogo?</p><small>Esta acción no estará disponible si el producto ya tiene pedidos o solicitudes.</small><div class="delete-modal-actions"><button type="button" class="button button-danger" :disabled="deleteBusy" @click="deleteProduct">{{ deleteBusy ? 'Eliminando…' : 'Sí, eliminar' }}</button><button type="button" class="button button-light" :disabled="deleteBusy" @click="cancelDelete">Cancelar</button></div></section></div>
  </main>
</template>
<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
import type { Product, CartItem } from '~/types/shop'
import { money } from '~/utils/money'
type Zone = { id: string; name: string; fee: number; weekdays: number[]; deliveryTimes: string[]; available: boolean }
type Order = { id: string; createdAt: string; customer: { name: string; phone: string; address: string; notes: string; location?: { lat: number; lon: number } }; items: CartItem[]; zoneId: string; deliveryDate: string; deliveryTime: string; total: number; status: string }
type ProductRequest = { id: string; createdAt: string; productId: string; productName: string; color: string; size: number; customer: { name: string; phone: string; notes: string }; status: 'nueva' | 'contactada' | 'cerrada' }
type InventoryItem = { productId: string; productName: string; color: string; size: number; stock: number }
type Dashboard = { soldCount: number; soldTotal: number; pendingCount: number; availablePairs: number; salesByDay: { date: string; orders: number; total: number }[] }
const tabs = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'inventory', label: 'Almacén' }, { id: 'products', label: 'Productos' }, { id: 'zones', label: 'Zonas de entrega' }, { id: 'orders', label: 'Pedidos' }, { id: 'requests', label: 'Solicitudes' }]
const weekdays = [{ value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' }, { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }, { value: 0, label: 'Domingo' }]
const tab = ref('dashboard')
watch(tab, () => { message.value = ''; deleteCandidate.value = null; zoneDeleteCandidate.value = null })
const [{ data: products, refresh: refreshProducts }, { data: zones, refresh: refreshZones }, { data: orders, refresh: refreshOrders }, { data: inventory, refresh: refreshInventory }, { data: dashboard, refresh: refreshDashboard }, { data: requests, refresh: refreshRequests }] = await Promise.all([useFetch<Product[]>('/api/products'), useFetch<Zone[]>('/api/admin/zones'), useFetch<Order[]>('/api/admin/orders'), useFetch<InventoryItem[]>('/api/admin/inventory'), useFetch<Dashboard>('/api/admin/dashboard'), useFetch<ProductRequest[]>('/api/admin/product-requests')])
const productForm = ref<Product | null>(null)
const productNameInput = ref<HTMLInputElement | null>(null)
const zoneForm = ref<Zone | null>(null)
const isNewProduct = ref(false)
const isNewZone = ref(false)
const busy = ref(false)
const message = ref('')
const deleteCandidate = ref<Product | null>(null)
const deleteBusy = ref(false)
const zoneDeleteCandidate = ref<Zone | null>(null)
const zoneDeleteBusy = ref(false)
const productInitialized = ref(false)
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
async function editProduct(item: Product) { productForm.value = copy({ ...item, images: item.images?.length ? item.images : [item.image] }); isNewProduct.value = false; message.value = ''; await nextTick(); productNameInput.value?.focus() }
function newProduct() { productForm.value = { id: '', name: '', category: 'Tenis casuales', price: 0, salePrice: null, description: '', colors: [], variants: [{ color: 'Negro', size: 25, stock: 0 }], image: '', images: [], tone: 'sand', requestOnly: false }; isNewProduct.value = true; message.value = '' }
function editZone(item: Zone) { zoneForm.value = copy(item); isNewZone.value = false; message.value = '' }
function newZone() { zoneForm.value = { id: '', name: '', fee: 0, weekdays: [], deliveryTimes: ['10:00'], available: true }; isNewZone.value = true; message.value = '' }
watchEffect(() => { if (!productInitialized.value && products.value?.[0]) { productInitialized.value = true; editProduct(products.value[0]) } })
watchEffect(() => { if (zones.value?.[0] && !zoneForm.value) editZone(zones.value[0]) })
async function chooseImages(event: Event) {
  const files = [...((event.target as HTMLInputElement).files ?? [])]
  if (!files.length || !productForm.value) return
  if (files.some(file => file.size > 5_000_000)) { message.value = 'Cada imagen debe pesar menos de 5 MB.'; return }
  busy.value = true; message.value = `Subiendo ${files.length} ${files.length === 1 ? 'imagen' : 'imágenes'}…`
  try {
    const uploaded = await Promise.all(files.map(file => { const form = new FormData(); form.append('file', file); return $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body: form }) }))
    if (productForm.value) { productForm.value.images.push(...uploaded.map(item => item.url)); productForm.value.image = productForm.value.images[0]! }
    message.value = `${files.length} ${files.length === 1 ? 'imagen guardada' : 'imágenes guardadas'} en Vercel Blob.`
  } catch { message.value = 'No se pudo subir la imagen. Verifica BLOB_READ_WRITE_TOKEN en el backend.' }
  finally { busy.value = false }
}
function makeCover(index: number) { if (!productForm.value) return; const [image] = productForm.value.images.splice(index, 1); if (image) productForm.value.images.unshift(image); productForm.value.image = productForm.value.images[0] ?? '' }
function removeImage(index: number) { if (!productForm.value) return; productForm.value.images.splice(index, 1); productForm.value.image = productForm.value.images[0] ?? '' }
async function saveProduct() {
  if (!productForm.value) return
  busy.value = true; message.value = ''
  try { const saved = await $fetch<Product>(`/api/admin/products/${productForm.value.id}`, { method: 'PUT', body: productForm.value }); await Promise.all([refreshProducts(), refreshInventory(), refreshDashboard()]); editProduct(saved); message.value = 'Producto guardado. Ya aparece en la tienda.' }
  catch { message.value = 'No se pudo guardar. Revisa el identificador y que las variantes no estén repetidas.' }
  finally { busy.value = false }
}
function askDeleteProduct() { if (productForm.value) deleteCandidate.value = copy(productForm.value) }
function cancelDelete() { if (!deleteBusy.value) deleteCandidate.value = null }
async function deleteProduct() {
  if (!deleteCandidate.value) return
  deleteBusy.value = true; message.value = ''
  try {
    await $fetch(`/api/admin/products/${deleteCandidate.value.id}`, { method: 'DELETE' })
    await Promise.all([refreshProducts(), refreshInventory(), refreshDashboard()])
    productForm.value = null; isNewProduct.value = false; deleteCandidate.value = null
    message.value = 'Producto eliminado y catálogo actualizado.'
  } catch { deleteCandidate.value = null; message.value = 'No se pudo eliminar. Si ya tiene pedidos o solicitudes, consérvalo en el catálogo.' }
  finally { deleteBusy.value = false }
}
function askDeleteZone() { if (zoneForm.value) zoneDeleteCandidate.value = copy(zoneForm.value) }
function cancelDeleteZone() { if (!zoneDeleteBusy.value) zoneDeleteCandidate.value = null }
async function deleteZone() {
  if (!zoneDeleteCandidate.value) return
  zoneDeleteBusy.value = true; message.value = ''
  try {
    await $fetch(`/api/admin/zones/${zoneDeleteCandidate.value.id}`, { method: 'DELETE' })
    await refreshZones()
    zoneForm.value = null; isNewZone.value = false; zoneDeleteCandidate.value = null
    if (zones.value?.[0]) editZone(zones.value[0])
    message.value = 'Zona eliminada y lista actualizada.'
  } catch { zoneDeleteCandidate.value = null; message.value = 'No se pudo eliminar. La zona puede estar vinculada a pedidos registrados.' }
  finally { zoneDeleteBusy.value = false }
}
async function saveZone() {
  if (!zoneForm.value) return
  busy.value = true; message.value = ''
  try { const saved = await $fetch<Zone>(`/api/admin/zones/${zoneForm.value.id}`, { method: 'PUT', body: zoneForm.value }); await refreshZones(); editZone(saved); message.value = 'Zona guardada. Ya se usa en el checkout.' }
  catch { message.value = 'No se pudo guardar la zona. Revisa sus datos.' }
  finally { busy.value = false }
}
async function changeStatus(id: string, status: string) {
  try { await $fetch(`/api/admin/orders/${id}`, { method: 'PATCH', body: { status } }); await Promise.all([refreshOrders(), refreshDashboard()]); message.value = status === 'vendido' ? 'Venta concretada.' : 'Estado actualizado.' }
  catch { message.value = 'No se pudo cambiar el estado.' }
}
async function markSold(id: string) { await changeStatus(id, 'vendido') }
async function changeRequestStatus(id: string, status: ProductRequest['status']) {
  try { await $fetch(`/api/admin/product-requests/${id}`, { method: 'PATCH', body: { status } }); await refreshRequests(); message.value = 'Solicitud actualizada.' }
  catch { await refreshRequests(); message.value = 'No se pudo actualizar la solicitud.' }
}
async function reloadDashboard() { await Promise.all([refreshDashboard(), refreshInventory(), refreshOrders()]) }
async function logout() { await $fetch('/api/admin/logout', { method: 'POST' }); await navigateTo('/admin/login') }
useHead({ title: 'Backoffice | MiPar' })
</script>

