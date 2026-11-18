<script setup lang="ts">
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()
const { cartOpen } = useUi()
const cart = useCart()
const notify = useNotify()
const confirmClear = ref(false)

function changeQty(documentId: string, qty: number) {
  const result = cart.updateQuantity(documentId, qty)
  if (!result.ok && result.message) notify.warning(result.message)
}

function remove(documentId: string, name: string) {
  cart.removeFromCart(documentId)
  notify.info(`Removed "${name}" from cart.`)
}

function clearAll() {
  cart.clearCart()
  confirmClear.value = false
  notify.info('Cart cleared.')
}

function goCheckout() {
  cartOpen.value = false
  navigateTo('/checkout')
}

function itemWarning(item: { isActive: boolean, stock: number, quantity: number }) {
  if (!item.isActive) return 'No longer available — please remove.'
  if (item.stock <= 0) return 'Out of stock — please remove.'
  if (item.quantity > item.stock) return `Only ${item.stock} available.`
  return ''
}
</script>

<template>
  <v-navigation-drawer v-model="cartOpen" location="right" temporary :width="xs ? 340 : 420">
    <div class="d-flex flex-column fill-height">
      <div class="d-flex align-center pa-4">
        <v-icon icon="mdi-cart-outline" class="mr-2" />
        <span class="text-strong">Shopping Cart</span>
        <v-chip size="small" class="ml-2" color="secondary" variant="tonal">{{ cart.cartCount.value }}</v-chip>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" aria-label="Close cart" @click="cartOpen = false" />
      </div>
      <v-divider />

      <!-- Empty cart -->
      <div v-if="cart.items.value.length === 0" class="flex-grow-1 d-flex flex-column align-center justify-center pa-8 text-center">
        <v-icon icon="mdi-cart-off" size="64" color="grey-lighten-1" />
        <p class="mt-3 text-strong">Your cart is empty</p>
        <p class="text-small text-muted">Browse products and tap “Add to Cart”.</p>
        <v-btn class="mt-4" color="primary" variant="tonal" to="/#products" @click="cartOpen = false">Start shopping</v-btn>
      </div>

      <!-- Items -->
      <div v-else class="flex-grow-1 overflow-y-auto">
        <v-list lines="three" class="py-0">
          <template v-for="(item, index) in cart.items.value" :key="item.documentId">
            <v-list-item class="py-3">
              <template #prepend>
                <v-avatar rounded="lg" size="64" class="mr-3 bg-grey-lighten-4">
                  <v-img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" cover />
                  <v-icon v-else :icon="categoryIcon(item.category)" />
                </v-avatar>
              </template>

              <div class="text-strong text-small">{{ item.name }}</div>
              <div class="text-tiny text-muted">{{ formatPrice(item.price) }} each · {{ item.stock }} in stock</div>
              <div v-if="itemWarning(item)" class="text-tiny text-error mt-1">
                <v-icon icon="mdi-alert-circle-outline" size="x-small" /> {{ itemWarning(item) }}
              </div>

              <div class="d-flex align-center justify-space-between mt-2">
                <QuantityStepper
                  :quantity="item.quantity"
                  :max="Math.max(1, item.stock)"
                  :disabled="!item.isActive || item.stock <= 0"
                  @update="(q) => changeQty(item.documentId, q)"
                />
                <span class="price-text">{{ formatPrice(cart.subtotal(item)) }}</span>
              </div>

              <template #append>
                <v-btn
                  icon="mdi-trash-can-outline"
                  variant="text"
                  color="error"
                  size="small"
                  :aria-label="`Remove ${item.name}`"
                  @click="remove(item.documentId, item.name)"
                />
              </template>
            </v-list-item>
            <v-divider v-if="index < cart.items.value.length - 1" />
          </template>
        </v-list>
      </div>

      <!-- Totals -->
      <div v-if="cart.items.value.length" class="pa-4 border-t">
        <div class="d-flex justify-space-between text-small mb-1">
          <span class="text-muted">Total items</span>
          <span class="text-strong">{{ cart.totalItems.value }}</span>
        </div>
        <div class="d-flex justify-space-between align-center mb-3">
          <span class="text-strong">Total amount</span>
          <span class="price-text" style="font-size: 1.3rem">{{ formatPrice(cart.totalAmount.value) }}</span>
        </div>
        <v-alert v-if="cart.invalidItems.value.length" type="warning" variant="tonal" density="compact" class="mb-3 text-small">
          Fix the highlighted items before checking out.
        </v-alert>
        <v-btn block size="large" color="primary" prepend-icon="mdi-cash-register" rounded="lg" @click="goCheckout">
          Checkout All
        </v-btn>
        <v-btn block variant="text" color="error" class="mt-2" prepend-icon="mdi-delete-sweep-outline" @click="confirmClear = true">
          Clear cart
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="confirmClear" max-width="380">
      <v-card rounded="xl" title="Clear cart?" text="All items will be removed from your cart.">
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmClear = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="clearAll">Clear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>
