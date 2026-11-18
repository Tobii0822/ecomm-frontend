<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <v-footer color="#0F172A" class="text-white pt-10 pb-6">
    <v-container class="max-w-page">
      <v-row>
        <v-col cols="12" md="4">
          <div class="d-flex align-center ga-2 mb-3">
            <v-avatar color="primary" size="36" rounded="lg">
              <v-icon icon="mdi-cart-variant" color="white" />
            </v-avatar>
            <span class="footer-brand">NicoMart</span>
          </div>
          <p class="footer-text">
            Everyday essentials, gadgets and gifts — delivered nationwide. A student project for Web Systems and Technologies.
          </p>
        </v-col>
        <v-col cols="6" md="2">
          <div class="footer-head">Shop</div>
          <NuxtLink to="/#products" class="footer-link">All Products</NuxtLink>
          <NuxtLink to="/#categories" class="footer-link">Categories</NuxtLink>
          <NuxtLink to="/checkout" class="footer-link">Checkout</NuxtLink>
        </v-col>
        <v-col cols="6" md="2">
          <div class="footer-head">Admin</div>
          <NuxtLink to="/products" class="footer-link">Manage Products</NuxtLink>
        </v-col>
        <v-col cols="12" md="4">
          <div class="footer-head">Contact</div>
          <p class="footer-text mb-1"><v-icon icon="mdi-map-marker-outline" size="small" /> St. Nicolas College of Business and Technology</p>
          <p class="footer-text mb-1"><v-icon icon="mdi-email-outline" size="small" /> support@nicomart.example</p>
          <div class="mt-2">
            <v-btn icon="mdi-facebook" variant="text" size="small" aria-label="Facebook" />
            <v-btn icon="mdi-instagram" variant="text" size="small" aria-label="Instagram" />
            <v-btn icon="mdi-twitter" variant="text" size="small" aria-label="Twitter" />
          </div>
        </v-col>
      </v-row>
      <v-divider class="my-4" color="white" />
      <div class="footer-text text-center">
        © {{ year }} NicoMart · Built with Nuxt 4, Vuetify 4, Strapi 5 &amp; PostgreSQL
      </div>
    </v-container>
  </v-footer>
</template>

<style scoped>
.footer-brand {
  font-size: 1.25rem;
  font-weight: 800;
}
.footer-head {
  font-weight: 700;
  margin-bottom: 10px;
}
.footer-link {
  display: block;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  margin-bottom: 6px;
}
.footer-link:hover {
  color: #fff;
}
.footer-text {
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.92rem;
}
</style>
