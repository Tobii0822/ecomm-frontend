<script setup lang="ts">
/**
 * Product Management (Guide 1 CRUD)  ( route: /products )
 *  Read   → GET    /api/products?populate=image (+ Strapi filters for search/category/status)
 *  Create → POST   /api/products            (image uploaded first via POST /api/upload)
 *  View   → dialog with full details
 *  Update → PUT    /api/products/:documentId
 *  Delete → DELETE /api/products/:documentId
 */
import { useDisplay } from 'vuetify'
import type { Product } from '~/utils/types'

useHead({ title: 'Product Management — NicoMart' })

const { xs } = useDisplay()
const { getProducts, deleteProduct, mediaUrl, errorMessage } = useStrapi()
const notify = useNotify()
const cart = useCart()
const wishlist = useWishlist()

// ----- List + filters (filters are sent to Strapi) -----
const products = ref<Product[]>([])
const loading = ref(false)
const loadError = ref('')

const search = ref('')
const category = ref<string>('all')
const status = ref<'all' | 'active' | 'inactive'>('all')

const statusOptions = [
  { title: 'All statuses', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

async function loadProducts() {
  loading.value = true
  loadError.value = ''
  try {
    products.value = await getProducts({
      search: search.value,
      category: category.value === 'all' ? undefined : category.value,
      isActive: status.value === 'all' ? null : status.value === 'active',
    })
  }
  catch (err) {
    loadError.value = errorMessage(err)
  }
  finally {
    loading.value = false
  }
}
onMounted(loadProducts)

// Debounce typing so we don't call Strapi on every keystroke
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadProducts, 400)
})
watch([category, status], loadProducts)

const stats = computed(() => ({
  total: products.value.length,
  active: products.value.filter(p => p.isActive).length,
  inactive: products.value.filter(p => !p.isActive).length,
  outOfStock: products.value.filter(p => p.stock <= 0).length,
}))

const headers = [
  { title: 'Image', key: 'image', sortable: false, width: 84 },
  { title: 'Name', key: 'name' },
  { title: 'Category', key: 'category' },
  { title: 'Price', key: 'price', align: 'end' as const, value: (p: Product) => Number(p.price) },
  { title: 'Stock', key: 'stock', align: 'center' as const },
  { title: 'Status', key: 'isActive', align: 'center' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

// ----- Create / Edit -----
const formOpen = ref(false)
const editing = ref<Product | null>(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(product: Product) {
  viewOpen.value = false
  editing.value = product
  formOpen.value = true
}
function onSaved(product: Product, mode: 'created' | 'updated') {
  notify.success(`Product "${product.name}" ${mode} successfully.`)
  loadProducts()
}

// ----- View -----
const viewOpen = ref(false)
const viewing = ref<Product | null>(null)
function openView(product: Product) {
  viewing.value = product
  viewOpen.value = true
}

// ----- Delete -----
const deleteOpen = ref(false)
const deleting = ref<Product | null>(null)
const deleteBusy = ref(false)

function askDelete(product: Product) {
  deleting.value = product
  deleteOpen.value = true
}
async function confirmDelete() {
  if (!deleting.value) return
  deleteBusy.value = true
  try {
    const { documentId, name } = deleting.value
    await deleteProduct(documentId)
    cart.removeFromCart(documentId)
    wishlist.remove(documentId)
    notify.success(`Product "${name}" deleted.`)
    deleteOpen.value = false
    await loadProducts()
  }
  catch (err) {
    notify.error(errorMessage(err, 'Delete failed.'))
  }
  finally {
    deleteBusy.value = false
  }
}

function stockColor(stock: number) {
  if (stock <= 0) return 'error'
  if (stock <= LOW_STOCK_THRESHOLD) return 'warning'
  return 'success'
}
</script>

<template>
  <v-container class="max-w-page py-8">
    <!-- Header -->
    <div class="d-flex flex-wrap align-center ga-3 mb-6">
      <div>
        <h1 class="section-title">Product Management</h1>
        <p class="section-subtitle">Create, view, update and delete products stored in Strapi.</p>
      </div>
      <v-spacer />
      <v-btn variant="tonal" prepend-icon="mdi-storefront-outline" to="/">Back to Shop</v-btn>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">Add Product</v-btn>
    </div>

    <!-- Stats -->
    <v-row dense class="mb-4">
      <v-col v-for="s in [
        { label: 'Products', value: stats.total, icon: 'mdi-package-variant-closed', color: 'primary' },
        { label: 'Active', value: stats.active, icon: 'mdi-eye-check-outline', color: 'success' },
        { label: 'Inactive', value: stats.inactive, icon: 'mdi-eye-off-outline', color: 'grey' },
        { label: 'Out of stock', value: stats.outOfStock, icon: 'mdi-alert-octagon-outline', color: 'error' },
      ]" :key="s.label" cols="6" md="3">
        <v-card rounded="xl" border elevation="0" class="pa-4 d-flex align-center ga-3">
          <v-avatar :color="s.color" variant="tonal" rounded="lg"><v-icon :icon="s.icon" /></v-avatar>
          <div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="text-tiny text-muted">{{ s.label }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Table -->
    <v-card rounded="xl" border elevation="0">
      <div class="pa-4">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              label="Search products"
              placeholder="Name, description or category"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              @click:clear="search = ''"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="category"
              :items="[{ label: 'All Categories', value: 'all' }, ...CATEGORIES]"
              item-title="label"
              item-value="value"
              label="Category"
              hide-details
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-select v-model="status" :items="statusOptions" label="Status" hide-details />
          </v-col>
        </v-row>
      </div>

      <v-alert v-if="loadError" type="error" variant="tonal" class="mx-4 mb-4" :text="loadError">
        <template #append>
          <v-btn color="error" variant="flat" @click="loadProducts">Retry</v-btn>
        </template>
      </v-alert>

      <v-data-table
        :headers="headers"
        :items="products"
        :loading="loading"
        :mobile="xs"
        item-value="documentId"
        :items-per-page="10"
        hover
        loading-text="Loading products from Strapi…"
        no-data-text="No products found."
      >
        <template #item.image="{ item }">
          <v-avatar rounded="lg" size="52" class="my-2 bg-grey-lighten-4">
            <v-img v-if="item.image" :src="mediaUrl(item.image, 'thumbnail') ?? undefined" :alt="item.name" cover />
            <v-icon v-else :icon="categoryIcon(item.category)" color="grey" />
          </v-avatar>
        </template>

        <template #item.name="{ item }">
          <div class="text-strong">{{ item.name }}</div>
          <div class="text-tiny text-muted line-clamp-2" style="max-width: 320px">{{ item.description }}</div>
        </template>

        <template #item.category="{ item }">
          <v-chip size="small" variant="tonal" color="primary" :prepend-icon="categoryIcon(item.category)">
            {{ categoryLabel(item.category) }}
          </v-chip>
        </template>

        <template #item.price="{ item }">
          <span class="text-strong">{{ formatPrice(item.price) }}</span>
        </template>

        <template #item.stock="{ item }">
          <v-chip size="small" :color="stockColor(item.stock)" variant="tonal">
            {{ item.stock <= 0 ? 'Out of stock' : item.stock }}
          </v-chip>
        </template>

        <template #item.isActive="{ item }">
          <v-chip size="small" :color="item.isActive ? 'success' : 'grey'" variant="flat">
            {{ item.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-btn icon="mdi-eye-outline" size="small" variant="text" color="info" :aria-label="`View ${item.name}`" @click="openView(item)" />
            <v-btn icon="mdi-pencil-outline" size="small" variant="text" color="primary" :aria-label="`Edit ${item.name}`" @click="openEdit(item)" />
            <v-btn icon="mdi-trash-can-outline" size="small" variant="text" color="error" :aria-label="`Delete ${item.name}`" @click="askDelete(item)" />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <ProductFormDialog v-model="formOpen" :product="editing" @saved="onSaved" />
    <ProductViewDialog v-model="viewOpen" :product="viewing" @edit="openEdit" />

    <v-dialog v-model="deleteOpen" max-width="420" :persistent="deleteBusy">
      <v-card v-if="deleting" rounded="xl">
        <v-card-title class="d-flex align-center ga-2 pt-4">
          <v-icon icon="mdi-alert-outline" color="error" /> Delete product?
        </v-card-title>
        <v-card-text>
          <strong>{{ deleting.name }}</strong> will be permanently removed from Strapi. This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="deleteBusy" @click="deleteOpen = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteBusy" prepend-icon="mdi-trash-can-outline" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.1;
}
</style>
