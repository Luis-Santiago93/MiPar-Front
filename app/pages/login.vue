<template>
  <main class="login-page shell"><div class="login-card"><span class="eyebrow">MIPAR · BACKOFFICE</span><h1>Iniciar sesión</h1><p>Entra para administrar productos, existencias y pedidos.</p><form @submit.prevent="login"><label for="username">Usuario</label><input id="username" v-model.trim="username" autocomplete="username" required /><label for="password">Contraseña</label><input id="password" v-model="password" type="password" autocomplete="current-password" required /><p v-if="error" class="form-error" role="alert">{{ error }}</p><button class="button button-dark" type="submit" :disabled="loading">{{ loading ? 'Entrando…' : 'Entrar al backoffice' }}</button></form></div></main>
</template>
<script setup lang="ts">
definePageMeta({ path: '/admin/login' })
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
async function login() {
  loading.value = true; error.value = ''
  try { await $fetch('/api/admin/login', { method: 'POST', body: { username: username.value, password: password.value } }); await navigateTo('/admin') }
  catch { error.value = 'Usuario o contraseña incorrectos.' }
  finally { loading.value = false }
}
useHead({ title: 'Iniciar sesión | MiPar' })
</script>
