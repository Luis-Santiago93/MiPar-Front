<template>
  <div>
    <header class="site-header"><div class="shell header-inner"><NuxtLink class="brand" to="/">Mi<span>Par</span><i>.</i></NuxtLink><nav aria-label="Navegación principal"><NuxtLink to="/">Explorar</NuxtLink><NuxtLink to="/carrito" class="cart-link">Mi bolsa <span v-if="cartCount" class="cart-count">{{ cartCount }}</span></NuxtLink><NuxtLink to="/admin">Backoffice</NuxtLink></nav></div></header>
    <NuxtPage />
    <footer class="site-footer"><div class="shell footer-inner"><strong>MiPar.</strong><span>Encuentra el tuyo.</span><small>Precios en MXN</small></div></footer>
  </div>
</template>
<script setup lang="ts">
const { cartCount } = useShop()
</script>
