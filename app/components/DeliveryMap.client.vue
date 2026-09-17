<template>
  <div ref="mapElement" class="delivery-map" role="application" aria-label="Mapa para elegir el punto de entrega" />
</template>

<script setup lang="ts">
type Point = { lat: number; lon: number }
type LeafletMap = { on: (event: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => void; setView: (point: [number, number], zoom: number) => void; remove: () => void }
type LeafletMarker = { setLatLng: (point: [number, number]) => void }
type Leaflet = {
  map: (element: HTMLElement) => LeafletMap
  tileLayer: (url: string, options: { attribution: string; maxZoom: number }) => { addTo: (map: LeafletMap) => void }
  marker: (point: [number, number]) => { addTo: (map: LeafletMap) => LeafletMarker }
}

const props = defineProps<{ point: Point | null }>()
const emit = defineEmits<{ pick: [point: Point] }>()
const mapElement = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let marker: LeafletMarker | null = null
let leafletInstance: Leaflet | null = null

function loadLeaflet(): Promise<Leaflet> {
  const browser = window as Window & { L?: Leaflet; miparLeaflet?: Promise<Leaflet> }
  if (browser.L) return Promise.resolve(browser.L)
  if (browser.miparLeaflet) return browser.miparLeaflet
  if (!document.querySelector('link[data-mipar-leaflet]')) {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    css.dataset.miparLeaflet = ''
    document.head.append(css)
  }
  browser.miparLeaflet = new Promise<Leaflet>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => browser.L ? resolve(browser.L) : reject(new Error('Leaflet no disponible'))
    script.onerror = () => reject(new Error('No se pudo cargar el mapa'))
    document.head.append(script)
  }).catch(error => { browser.miparLeaflet = undefined; throw error })
  return browser.miparLeaflet!
}

function showPoint(point: Point) {
  if (!map) return
  const position: [number, number] = [point.lat, point.lon]
  map.setView(position, 16)
  if (marker) marker.setLatLng(position)
  else if (leafletInstance) marker = leafletInstance.marker(position).addTo(map)
}

onMounted(async () => {
  try {
    const leaflet = await loadLeaflet()
    if (!mapElement.value) return
    leafletInstance = leaflet
    map = leaflet.map(mapElement.value)
    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    map.setView([17.9895, -92.9475], 12)
    map.on('click', event => emit('pick', { lat: event.latlng.lat, lon: event.latlng.lng }))
    if (props.point) showPoint(props.point)
  } catch {
    if (mapElement.value) mapElement.value.textContent = 'No se pudo cargar el mapa. Puedes escribir tu dirección abajo.'
  }
})
watch(() => props.point, point => { if (point) showPoint(point) })
onBeforeUnmount(() => map?.remove())
</script>
