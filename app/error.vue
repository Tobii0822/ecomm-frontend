<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error?.statusCode === 404)
</script>

<template>
  <v-app>
    <v-main class="d-flex align-center justify-center" style="min-height: 100vh">
      <div class="text-center pa-8">
        <v-icon :icon="is404 ? 'mdi-map-search-outline' : 'mdi-alert-circle-outline'" size="80" color="primary" />
        <h1 class="section-title mt-4">{{ is404 ? 'Page not found' : 'Something went wrong' }}</h1>
        <p class="section-subtitle">{{ is404 ? 'The page you are looking for does not exist.' : error?.message }}</p>
        <v-btn class="mt-6" color="primary" @click="clearError({ redirect: '/' })">Back to Home</v-btn>
      </div>
    </v-main>
  </v-app>
</template>
