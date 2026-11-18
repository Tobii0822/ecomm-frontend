<script setup lang="ts">
const notify = useNotify()
</script>

<template>
  <v-app>
    <AppHeader />
    <CartDrawer />
    <WishlistDrawer />

    <v-main class="bg-background">
      <slot />
      <AppFooter />
    </v-main>

    <!-- Global feedback message (success / error / info) -->
    <v-snackbar
      v-model="notify.state.value.show"
      :color="notify.state.value.color"
      :timeout="notify.state.value.timeout"
      location="bottom right"
      multi-line
    >
      <div class="d-flex align-center ga-2">
        <v-icon :icon="notify.state.value.icon" />
        <span>{{ notify.state.value.text }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" icon="mdi-close" aria-label="Close" @click="notify.state.value.show = false" />
      </template>
    </v-snackbar>
  </v-app>
</template>
