<script setup lang="ts">
import type { Product } from '~/utils/types'

const props = defineProps<{ product: Product }>()

const { mediaUrl } = useStrapi()
const cart = useCart()
const wishlist = useWishlist()
const notify = useNotify()

const imageUrl = computed(() => mediaUrl(props.product.image, 'small'))
const inCart = computed(() => cart.quantityInCart(props.product.documentId))
const remaining = computed(() => props.product.stock - inCart.value)
const wished = computed(() => wishlist.isWished(props.product.documentId))

const stockInfo = computed(() => {
  const s = props.product.stock
  if (s <= 0) return { text: 'Out of stock', color: 'error', icon: 'mdi-close-circle-outline' }
  if (s <= LOW_STOCK_THRESHOLD) return { text: `Only ${s} left`, color: 'warning', icon: 'mdi-alert-outline' }
  return { text: `${s} in stock`, color: 'success', icon: 'mdi-check-circle-outline' }
})

const buttonLabel = computed(() => {
  if (props.product.stock <= 0) return 'Out of Stock'
  if (remaining.value <= 0) return 'Max in Cart'
  return 'Add to Cart'
})

function onAdd() {
  const result = cart.addToCart(props.product, 1)
  result.ok ? notify.success(result.message) : notify.warning(result.message)
}

function onToggleWishlist() {
  const added = wishlist.toggle(props.product)
  added
    ? notify.success(`Added "${props.product.name}" to your wishlist.`)
    : notify.info(`Removed "${props.product.name}" from your wishlist.`)
}
</script>

<template>
  <v-card class="product-card h-100 d-flex flex-column" rounded="xl" border elevation="0">
    <div class="position-relative">
      <v-img :src="imageUrl ?? undefined" :alt="product.name" aspect-ratio="1" cover class="bg-grey-lighten-4">
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="primary" size="28" />
          </div>
        </template>
        <template #error>
          <div class="d-flex flex-column align-center justify-center fill-height text-muted">
            <v-icon icon="mdi-image-off-outline" size="40" />
            <span class="text-tiny mt-1">No image</span>
          </div>
        </template>
        <div v-if="!imageUrl" class="d-flex flex-column align-center justify-center fill-height text-muted">
          <v-icon :icon="categoryIcon(product.category)" size="56" />
          <span class="text-tiny mt-1">No image</span>
        </div>
      </v-img>

      <v-btn
        class="wish-btn"
        :icon="wished ? 'mdi-heart' : 'mdi-heart-outline'"
        :color="wished ? 'pink' : undefined"
        size="small"
        variant="elevated"
        :aria-label="wished ? 'Remove from wishlist' : 'Add to wishlist'"
        @click="onToggleWishlist"
      />
      <v-chip v-if="product.stock <= 0" class="sold-out" color="error" variant="flat" size="small">
        Sold out
      </v-chip>
    </div>

    <v-card-text class="flex-grow-1 pb-2">
      <v-chip size="x-small" variant="tonal" color="primary" :prepend-icon="categoryIcon(product.category)" class="mb-2">
        {{ categoryLabel(product.category) }}
      </v-chip>
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="text-small text-muted line-clamp-2 mt-1 mb-2">{{ product.description || 'No description provided.' }}</p>
      <div class="d-flex align-center justify-space-between flex-wrap ga-1">
        <span class="price-text product-price">{{ formatPrice(product.price) }}</span>
        <v-chip :color="stockInfo.color" :prepend-icon="stockInfo.icon" size="x-small" variant="tonal">
          {{ stockInfo.text }}
        </v-chip>
      </div>
      <div v-if="inCart > 0" class="text-tiny text-muted mt-1">{{ inCart }} in your cart</div>
    </v-card-text>

    <v-card-actions class="px-4 pb-4 pt-0">
      <v-btn
        block
        color="primary"
        variant="flat"
        rounded="lg"
        prepend-icon="mdi-cart-plus"
        :disabled="product.stock <= 0 || remaining <= 0"
        @click="onAdd"
      >
        {{ buttonLabel }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.product-card {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
}
.wish-btn {
  position: absolute;
  top: 10px;
  right: 10px;
}
.sold-out {
  position: absolute;
  top: 12px;
  left: 12px;
}
.product-name {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
}
.product-price {
  font-size: 1.15rem;
}
</style>
