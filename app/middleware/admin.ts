export default defineNuxtRouteMiddleware(async to => {
  if (to.path === '/admin/login') return
  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/admin/session', { headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined })
    if (!session.authenticated) return navigateTo('/admin/login')
  } catch { return navigateTo('/admin/login') }
})
