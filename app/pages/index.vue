<template>
  <main>
    <section class="intro shell"><div><span class="eyebrow">TU SIGUIENTE PAR EMPIEZA AQUÍ</span><h1>Encuentra el par que va contigo<span>.</span></h1><p>Explora modelos, elige tu talla y revisa disponibilidad en un solo lugar.</p><a class="button button-dark" href="#catalogo">Ver catálogo <span aria-hidden="true">↗</span></a></div><div class="intro-art"><div class="intro-circle"></div><img src="/images/urbano-uno.png" alt="Tenis casuales color marfil" /></div></section>
    <section id="catalogo" class="catalog shell"><div class="section-heading"><div><span class="eyebrow">COLECCIÓN MIPAR</span><h2>Elige tu favorito</h2></div><span class="results">{{ products.length }} modelos para explorar</span></div><div class="product-grid"><NuxtLink v-for="product in products" :key="product.id" :to="`/p/${product.id}`" class="product-card"><div :class="['product-image', product.tone]"><span v-if="product.requestOnly" class="badge">Solo solicitud</span><span v-else-if="product.badge" class="badge">{{ product.badge }}</span><img :src="product.image" :alt="product.name" /></div><div class="product-info"><div><small>{{ product.category }}</small><h3>{{ product.name }}</h3></div><div v-if="!product.requestOnly" class="catalog-price"><del v-if="product.salePrice">{{ money(product.price) }}</del><strong :class="{ 'sale-price': product.salePrice }">{{ money(product.salePrice ?? product.price) }}</strong></div><strong v-else class="request-card-label">Consultar</strong></div><span class="product-action">{{ product.requestOnly ? 'Ver modelo y solicitar' : 'Ver colores y tallas' }} <span aria-hidden="true">↗</span></span></NuxtLink></div></section>
  </main>
</template>
<script setup lang="ts">
import type { Product } from '~/types/shop'
import { money } from '~/utils/money'
const { data } = await useFetch<Product[]>('/api/products')
const products = computed(() => data.value ?? [])
const { setProducts } = useShop()
watchEffect(() => { if (data.value) setProducts(data.value) })
</script>
