/**
 * Registers Vuetify 4 with the Nuxt (Vue 3) app.
 * - All components/directives are registered so templates can use <v-btn>, <v-card>, ...
 * - Icons use the Material Design Icons font (mdi-*)
 * - A custom light theme gives the shop its brand colors
 */
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: { mdi },
    },
    theme: {
      defaultTheme: 'nicomart',
      themes: {
        nicomart: {
          dark: false,
          colors: {
            primary: '#0F766E',
            secondary: '#F59E0B',
            accent: '#6366F1',
            error: '#DC2626',
            warning: '#D97706',
            info: '#2563EB',
            success: '#16A34A',
            background: '#F8FAFC',
            surface: '#FFFFFF',
          },
        },
      },
    },
    defaults: {
      VBtn: { style: 'text-transform: none; letter-spacing: normal;' },
      VTextField: { variant: 'outlined', density: 'comfortable' },
      VTextarea: { variant: 'outlined', density: 'comfortable' },
      VSelect: { variant: 'outlined', density: 'comfortable' },
      VFileInput: { variant: 'outlined', density: 'comfortable' },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
