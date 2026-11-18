<script setup lang="ts">
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()
const { wishlistOpen } = useUi()
const wishlist = useWishlist()
const cart = useCart()
const notify = useNotify()
const { getProduct, errorMessage } = useStrapi()

const adding = ref<string | null>(null)

/** Loads the latest product data first so stock/active checks are accurate. */
async function moveToCart(documentId: string) {
  adding.value = documentId
  try {
    const product = await getProduct(documentId)
    const result = cart.addToCart(product, 1)
    result.ok ? notify.success(result.message) : notify.warning(result.message)
  }
  catch (err: any) {
    if (err?.response?.status === 404) {
      wishlist.remove(documentId)
      notify.warning('That product no longer exists and was removed from your wishlist.')
    }
    else {
      notify.error(errorMessage(err))
    }
  }
  finally {
    adding.value = null
  }
}

function remove(documentId: string, name: string) {
  wishlist.remove(documentId)
  notify.info(`Removed "${name}" from your wishlist.`)
}
</script>

<template>
  <v-navigation-drawer v-model="wishlistOpen" location="right" temporary :width="xs ? 340 : 400">
    <div class="d-flex align-center pa-4">
      <v-icon icon="mdi-heart-outline" color="pink" class="mr-2" />
      <span class="text-strong">Wishlist</span>
      <v-chip size="small" class="ml-2" color="pink" variant="tonal">{{ wishlist.wishlistCount.value }}</v-chip>
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" aria-label="Close wishlist" @click="wishlistOpen = false" />
    </div>
    <v-divider />

    <div v-if="!wishlist.items.value.length" class="d-flex flex-column align-center justify-center pa-8 text-center">
      <v-icon icon="mdi-heart-off-outline" size="64" color="grey-lighten-1" />
      <p class="mt-3 text-strong">No saved items yet</p>
      <p class="text-small text-muted">Tap the heart on any product to save it here.</p>
    </div>

    <v-list v-else lines="two">
      <v-list-item v-for="item in wishlist.items.value" :key="item.documentId" class="py-2">
        <template #prepend>
          <v-avatar rounded="lg" size="56" class="mr-3 bg-grey-lighten-4">
            <v-img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" cover />
            <v-icon v-else :icon="categoryIcon(item.category)" />
          </v-avatar>
        </template>
        <div class="text-strong text-small">{{ item.name }}</div>
        <div class="text-tiny text-muted">{{ categoryLabel(item.category) }} · {{ formatPrice(item.price) }}</div>
        <div class="d-flex ga-2 mt-2">
          <v-btn
            size="small"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-cart-plus"
            :loading="adding === item.documentId"
            @click="moveToCart(item.documentId)"
          >
            Add to cart
          </v-btn>
          <v-btn size="small" variant="text" color="error" prepend-icon="mdi-heart-remove-outline" @click="remove(item.documentId, item.name)">
            Remove
          </v-btn>
        </div>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
