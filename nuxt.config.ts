// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Client-side rendering: the cart and wishlist live in localStorage,
  // so rendering in the browser avoids server/client hydration mismatches.
  ssr: false,

  css: ['@mdi/font/css/materialdesignicons.css', '~/assets/css/main.css'],

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    public: {
      // Override with NUXT_PUBLIC_STRAPI_URL in frontend/.env
      strapiUrl: 'http://localhost:1337',
    },
  },

  app: {
    head: {
      title: 'NicoMart — Shop Smart',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'NicoMart e-commerce demo built with Nuxt 4, Vuetify 4 and Strapi 5.' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
