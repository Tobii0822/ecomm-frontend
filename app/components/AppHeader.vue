<script setup lang="ts">
import { useDisplay } from 'vuetify'

const { mdAndUp } = useDisplay()
const { cartOpen, wishlistOpen } = useUi()
const { cartCount } = useCart()
const { wishlistCount } = useWishlist()
const route = useRoute()

const mobileNav = ref(false)

const links = [
  { title: 'Home', to: '/', icon: 'mdi-home-outline' },
  { title: 'Shop', to: '/#products', icon: 'mdi-storefront-outline' },
  { title: 'Checkout', to: '/checkout', icon: 'mdi-cash-register' },
  { title: 'Manage Products', to: '/products', icon: 'mdi-view-dashboard-edit-outline' },
]

function openCart() {
  wishlistOpen.value = false
  cartOpen.value = true
}
function openWishlist() {
  cartOpen.value = false
  wishlistOpen.value = true
}
</script>

<template>
  <v-app-bar flat border="b" color="surface" height="68">
    <v-app-bar-nav-icon v-if="!mdAndUp" aria-label="Open menu" @click="mobileNav = !mobileNav" />

    <NuxtLink to="/" class="d-flex align-center ga-2 ml-3 text-decoration-none brand">
      <v-avatar color="primary" size="38" rounded="lg">
        <v-icon icon="mdi-cart-variant" color="white" />
      </v-avatar>
      <span class="brand-name">Nico<span class="text-secondary">Mart</span></span>
    </NuxtLink>

    <v-spacer />

    <template v-if="mdAndUp">
      <v-btn
        v-for="link in links"
        :key="link.title"
        :to="link.to"
        :prepend-icon="link.icon"
        :active="route.path === link.to"
        variant="text"
        class="mx-1"
      >
        {{ link.title }}
      </v-btn>
      <v-divider vertical class="mx-2 my-4" />
    </template>

    <v-btn icon aria-label="Open wishlist" @click="openWishlist">
      <v-badge :content="wishlistCount" :model-value="wishlistCount > 0" color="pink">
        <v-icon icon="mdi-heart-outline" />
      </v-badge>
    </v-btn>
    <v-btn icon class="mr-2" aria-label="Open cart" @click="openCart">
      <v-badge :content="cartCount" :model-value="cartCount > 0" color="secondary">
        <v-icon icon="mdi-cart-outline" />
      </v-badge>
    </v-btn>
  </v-app-bar>

  <!-- Mobile / tablet navigation -->
  <v-navigation-drawer v-model="mobileNav" temporary location="left" width="280">
    <v-list nav>
      <v-list-subheader>NicoMart</v-list-subheader>
      <v-list-item
        v-for="link in links"
        :key="link.title"
        :to="link.to"
        :prepend-icon="link.icon"
        :title="link.title"
        @click="mobileNav = false"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
.brand-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.02em;
}
</style>
