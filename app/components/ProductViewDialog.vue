<script setup lang="ts">
import type { Product } from '~/utils/types'

defineProps<{ product: Product | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ (e: 'edit', product: Product): void }>()

const { mediaUrl } = useStrapi()

function fmtDate(v?: string) {
  return v ? new Date(v).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}
</script>

<template>
  <v-dialog v-model="open" max-width="720" scrollable>
    <v-card v-if="product" rounded="xl">
      <v-card-title class="d-flex align-center ga-2 pt-4 px-6">
        <v-icon icon="mdi-eye-outline" color="primary" /> Product Details
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" aria-label="Close" @click="open = false" />
      </v-card-title>
      <v-divider />
      <v-card-text class="px-6 pt-5">
        <v-row>
          <v-col cols="12" sm="5">
            <v-img
              v-if="product.image"
              :src="mediaUrl(product.image, 'medium') ?? undefined"
              :alt="product.image.alternativeText || product.name"
              aspect-ratio="1"
              cover
              class="rounded-lg bg-grey-lighten-4"
            />
            <div v-else class="no-image d-flex flex-column align-center justify-center text-muted rounded-lg">
              <v-icon :icon="categoryIcon(product.category)" size="56" />
              <span class="text-tiny">No image</span>
            </div>
          </v-col>
          <v-col cols="12" sm="7">
            <div class="d-flex flex-wrap ga-2 mb-2">
              <v-chip size="small" color="primary" variant="tonal" :prepend-icon="categoryIcon(product.category)">
                {{ categoryLabel(product.category) }}
              </v-chip>
              <v-chip size="small" :color="product.isActive ? 'success' : 'grey'" variant="flat">
                {{ product.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
            <h2 class="view-name">{{ product.name }}</h2>
            <p class="text-muted mt-2">{{ product.description || 'No description provided.' }}</p>

            <v-table density="compact" class="mt-3">
              <tbody>
                <tr><td class="text-muted">Price</td><td class="price-text">{{ formatPrice(product.price) }}</td></tr>
                <tr>
                  <td class="text-muted">Stock</td>
                  <td>
                    <v-chip size="small" :color="product.stock <= 0 ? 'error' : product.stock <= LOW_STOCK_THRESHOLD ? 'warning' : 'success'" variant="tonal">
                      {{ product.stock <= 0 ? 'Out of stock' : `${product.stock} units` }}
                    </v-chip>
                  </td>
                </tr>
                <tr><td class="text-muted">Document ID</td><td><code>{{ product.documentId }}</code></td></tr>
                <tr><td class="text-muted">Created</td><td>{{ fmtDate(product.createdAt) }}</td></tr>
                <tr><td class="text-muted">Updated</td><td>{{ fmtDate(product.updatedAt) }}</td></tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn variant="text" @click="open = false">Close</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-pencil-outline" @click="emit('edit', product)">Edit</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.view-name {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
}
.no-image {
  aspect-ratio: 1;
  background: #f1f5f9;
}
</style>
