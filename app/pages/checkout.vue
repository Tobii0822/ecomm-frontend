<script setup lang="ts">
/**
 * Checkout All  ( route: /checkout )
 * 1. Refreshes cart items with the latest Strapi data (price, stock, active)
 * 2. Validates the customer form (Vuetify rules)
 * 3. POST /api/orders/checkout → Strapi re-validates and deducts stock in a transaction
 * 4. On success: clear cart, show receipt with updated stock. On error: keep cart, show why.
 */
import type { CheckoutForm, CheckoutProblem } from '~/utils/types'

useHead({ title: 'Checkout — NicoMart' })

const cart = useCart()
const notify = useNotify()
const { checkout, getProductsByIds, errorMessage } = useStrapi()

// ----- Refresh cart with live product data -----
const refreshing = ref(false)
const syncNotes = ref<string[]>([])

async function refreshCart(): Promise<boolean> {
  if (!cart.items.value.length) return true
  refreshing.value = true
  try {
    const fresh = await getProductsByIds(cart.items.value.map(i => i.documentId))
    syncNotes.value = cart.syncWithProducts(fresh)
    return true
  }
  catch (err) {
    notify.error(errorMessage(err, 'Could not refresh product data.'))
    return false
  }
  finally {
    refreshing.value = false
  }
}
onMounted(refreshCart)

// ----- Customer form -----
const formRef = ref()
const form = reactive<CheckoutForm>({
  fullName: '',
  contactNumber: '',
  deliveryAddress: '',
  paymentMethod: '',
})
const serverFieldErrors = ref<Partial<Record<keyof CheckoutForm, string>>>({})
watch(form, () => { serverFieldErrors.value = {} })

// ----- Submit -----
const submitting = ref(false)
const problems = ref<CheckoutProblem[]>([])
const generalError = ref('')

const successDialog = ref(false)
const receipt = ref<any>(null)

function changeQty(documentId: string, qty: number) {
  const result = cart.updateQuantity(documentId, qty)
  if (!result.ok && result.message) notify.warning(result.message)
}

async function placeOrder() {
  problems.value = []
  generalError.value = ''

  // 1) Form validation
  const { valid } = await formRef.value.validate()
  if (!valid) {
    notify.warning('Please complete the required checkout fields.')
    return
  }
  if (!cart.items.value.length) {
    notify.warning('Your cart is empty.')
    return
  }

  submitting.value = true
  try {
    // 2) Make sure the cart reflects current stock / active status
    const ok = await refreshCart()
    if (!ok) return
    if (cart.invalidItems.value.length) {
      generalError.value = 'Some items are unavailable or exceed the available stock. Please update your cart.'
      return
    }

    // 3) Submit to Strapi (server validates again and deducts stock)
    const res = await checkout(
      { ...form, contactNumber: form.contactNumber.replace(/[\s-]/g, '') },
      cart.items.value.map(i => ({ documentId: i.documentId, quantity: i.quantity })),
    )

    // 4) Success → clear cart ONLY now, then show receipt
    receipt.value = res.data
    cart.clearCart()
    formRef.value.reset()
    successDialog.value = true
    notify.success(`Order ${res.data.orderNumber} placed successfully!`)
  }
  catch (err: any) {
    const details = err?.data?.error?.details
    if (details?.problems) problems.value = details.problems
    if (details?.fields) serverFieldErrors.value = details.fields
    generalError.value = errorMessage(err, 'Checkout failed. Please try again.')
    notify.error(generalError.value)
    // Refresh so the cart shows the latest stock after a failed attempt
    await refreshCart()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-container class="max-w-page py-8">
    <div class="d-flex align-center flex-wrap ga-2 mb-6">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/">Continue shopping</v-btn>
      <v-spacer />
      <h1 class="section-title">Checkout All</h1>
    </div>

    <!-- Empty cart -->
    <v-card v-if="!cart.items.value.length && !successDialog" class="text-center pa-10" rounded="xl" border elevation="0">
      <v-icon icon="mdi-cart-off" size="72" color="grey-lighten-1" />
      <p class="text-strong mt-3">Your cart is empty</p>
      <p class="text-small text-muted">Add some products before checking out.</p>
      <v-btn color="primary" class="mt-3" to="/#products">Browse products</v-btn>
    </v-card>

    <v-row v-else-if="cart.items.value.length">
      <!-- ========== Customer information ========== -->
      <v-col cols="12" md="7" order="2" order-md="1">
        <v-card rounded="xl" border elevation="0" class="pa-2 pa-sm-4">
          <v-card-title class="d-flex align-center ga-2">
            <v-icon icon="mdi-account-outline" color="primary" /> Customer Information
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" @submit.prevent="placeOrder">
              <v-text-field
                v-model="form.fullName"
                label="Full Name *"
                prepend-inner-icon="mdi-account"
                :rules="[rules.required('Full name'), rules.minLength(3, 'Full name'), rules.maxLength(100, 'Full name')]"
                :error-messages="serverFieldErrors.fullName"
                autocomplete="name"
                class="mb-2"
              />
              <v-text-field
                v-model="form.contactNumber"
                label="Contact Number *"
                placeholder="09XXXXXXXXX"
                prepend-inner-icon="mdi-phone"
                :rules="[rules.required('Contact number'), rules.phMobile]"
                :error-messages="serverFieldErrors.contactNumber"
                type="tel"
                autocomplete="tel"
                class="mb-2"
              />
              <v-textarea
                v-model="form.deliveryAddress"
                label="Delivery Address *"
                placeholder="House no., street, barangay, city, province"
                prepend-inner-icon="mdi-map-marker"
                :rules="[rules.required('Delivery address'), rules.minLength(10, 'Delivery address'), rules.maxLength(300, 'Delivery address')]"
                :error-messages="serverFieldErrors.deliveryAddress"
                rows="3"
                auto-grow
                counter="300"
                class="mb-2"
              />

              <div class="text-strong mb-2">Payment Method *</div>
              <v-radio-group
                v-model="form.paymentMethod"
                :rules="[rules.required('Payment method')]"
                :error-messages="serverFieldErrors.paymentMethod"
              >
                <v-row dense>
                  <v-col v-for="pm in PAYMENT_METHODS" :key="pm.value" cols="12" sm="6">
                    <v-card
                      :variant="form.paymentMethod === pm.value ? 'tonal' : 'outlined'"
                      :color="form.paymentMethod === pm.value ? 'primary' : undefined"
                      rounded="lg"
                      class="pa-2"
                      @click="form.paymentMethod = pm.value"
                    >
                      <v-radio :value="pm.value">
                        <template #label>
                          <div class="d-flex align-center ga-2">
                            <v-icon :icon="pm.icon" />
                            <div>
                              <div class="text-strong text-small">{{ pm.value }}</div>
                              <div class="text-tiny text-muted">{{ pm.hint }}</div>
                            </div>
                          </div>
                        </template>
                      </v-radio>
                    </v-card>
                  </v-col>
                </v-row>
              </v-radio-group>

              <v-alert v-if="generalError" type="error" variant="tonal" class="mb-4" :title="generalError">
                <ul v-if="problems.length" class="pl-4 mt-1">
                  <li v-for="p in problems" :key="p.documentId">{{ p.message }}</li>
                </ul>
              </v-alert>

              <v-btn
                type="submit"
                block
                size="x-large"
                color="primary"
                rounded="lg"
                prepend-icon="mdi-check-decagram"
                :loading="submitting"
                :disabled="refreshing"
              >
                Place Order · {{ formatPrice(cart.totalAmount.value) }}
              </v-btn>
              <p class="text-tiny text-muted text-center mt-2">
                Fictitious test data only — no real payment is processed.
              </p>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- ========== Order summary ========== -->
      <v-col cols="12" md="5" order="1" order-md="2">
        <v-card rounded="xl" border elevation="0" class="summary">
          <v-card-title class="d-flex align-center ga-2 pt-4">
            <v-icon icon="mdi-receipt-text-outline" color="primary" /> Order Summary
            <v-spacer />
            <v-btn size="small" variant="text" icon="mdi-refresh" :loading="refreshing" aria-label="Refresh stock" @click="refreshCart" />
          </v-card-title>

          <v-alert v-if="syncNotes.length" type="warning" variant="tonal" density="compact" class="mx-4 mb-2 text-small">
            <div v-for="note in syncNotes" :key="note">{{ note }}</div>
          </v-alert>

          <v-list class="py-0">
            <v-list-item v-for="item in cart.items.value" :key="item.documentId" class="py-3">
              <template #prepend>
                <v-avatar rounded="lg" size="56" class="mr-3 bg-grey-lighten-4">
                  <v-img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" cover />
                  <v-icon v-else :icon="categoryIcon(item.category)" />
                </v-avatar>
              </template>
              <div class="text-strong text-small">{{ item.name }}</div>
              <div class="text-tiny text-muted">{{ formatPrice(item.price) }} × {{ item.quantity }}</div>
              <div
                v-if="!item.isActive || item.stock <= 0 || item.quantity > item.stock"
                class="text-tiny text-error"
              >
                {{ !item.isActive ? 'Unavailable' : item.stock <= 0 ? 'Out of stock' : `Only ${item.stock} in stock` }}
              </div>
              <div class="d-flex align-center justify-space-between mt-2">
                <QuantityStepper
                  :quantity="item.quantity"
                  :max="Math.max(1, item.stock)"
                  :disabled="!item.isActive || item.stock <= 0 || submitting"
                  @update="(q) => changeQty(item.documentId, q)"
                />
                <span class="text-strong">{{ formatPrice(cart.subtotal(item)) }}</span>
              </div>
              <template #append>
                <v-btn
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  :disabled="submitting"
                  :aria-label="`Remove ${item.name}`"
                  @click="cart.removeFromCart(item.documentId)"
                />
              </template>
            </v-list-item>
          </v-list>

          <v-divider />
          <div class="pa-4">
            <div class="d-flex justify-space-between text-small mb-1">
              <span class="text-muted">Products</span><span>{{ cart.cartCount.value }}</span>
            </div>
            <div class="d-flex justify-space-between text-small mb-1">
              <span class="text-muted">Total items</span><span>{{ cart.totalItems.value }}</span>
            </div>
            <div class="d-flex justify-space-between text-small mb-3">
              <span class="text-muted">Shipping</span><span class="text-success">Free</span>
            </div>
            <v-divider class="mb-3" />
            <div class="d-flex justify-space-between align-center">
              <span class="text-strong">Total amount</span>
              <span class="price-text" style="font-size: 1.4rem">{{ formatPrice(cart.totalAmount.value) }}</span>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ========== Success receipt ========== -->
    <v-dialog v-model="successDialog" max-width="520" persistent>
      <v-card v-if="receipt" rounded="xl" class="pa-2">
        <div class="text-center pt-6">
          <v-avatar color="success" size="72"><v-icon icon="mdi-check-bold" size="40" color="white" /></v-avatar>
          <h2 class="section-title mt-4">Order placed!</h2>
          <p class="text-muted text-small">Order number <strong>{{ receipt.orderNumber }}</strong></p>
        </div>
        <v-card-text>
          <v-table density="compact">
            <thead>
              <tr><th>Item</th><th class="text-center">Qty</th><th class="text-right">Subtotal</th><th class="text-right">Stock left</th></tr>
            </thead>
            <tbody>
              <tr v-for="line in receipt.items" :key="line.documentId">
                <td>{{ line.name }}</td>
                <td class="text-center">{{ line.quantity }}</td>
                <td class="text-right">{{ formatPrice(line.subtotal) }}</td>
                <td class="text-right">
                  {{ receipt.updatedStock?.find((s: any) => s.documentId === line.documentId)?.stock ?? '—' }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <div class="d-flex justify-space-between mt-3"><span>Total items</span><strong>{{ receipt.totalItems }}</strong></div>
          <div class="d-flex justify-space-between"><span>Total amount</span><strong class="price-text">{{ formatPrice(receipt.totalAmount) }}</strong></div>
          <div class="d-flex justify-space-between"><span>Payment</span><span>{{ receipt.paymentMethod }}</span></div>
          <div class="d-flex justify-space-between"><span>Deliver to</span><span class="text-right ml-4">{{ receipt.fullName }}</span></div>
        </v-card-text>
        <v-card-actions class="flex-wrap ga-2 px-4 pb-4">
          <v-btn variant="tonal" prepend-icon="mdi-view-dashboard-edit-outline" to="/products" @click="successDialog = false">
            View stock in Product Management
          </v-btn>
          <v-spacer />
          <v-btn color="primary" variant="flat" to="/" @click="successDialog = false">Continue shopping</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
@media (min-width: 960px) {
  .summary {
    position: sticky;
    top: 84px;
  }
}
</style>
