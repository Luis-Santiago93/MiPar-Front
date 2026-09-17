export default defineNuxtConfig({
  compatibilityDate: '2026-09-14',
  runtimeConfig: {
    adminUser: '',
    adminPassword: '',
    backendBaseUrl: '',
    public: { externalBackend: false }
  },
  css: ['~/assets/css/main.css'],
  app: { head: { title: 'MiPar | Encuentra tu par', meta: [{ name: 'description', content: 'Encuentra zapatos para ti. Consulta colores, tallas y disponibilidad antes de pedir.' }], link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }] } }
})
