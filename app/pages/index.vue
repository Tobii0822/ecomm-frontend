<script setup lang="ts">
/**
 * E-Commerce Homepage  ( route: / )
 * - Loads ACTIVE products from Strapi:  GET /api/products?populate=image&filters[isActive][$eq]=true
 * - Search (name / description / category) + category filter run instantly on the loaded list.
 */
import type { Product } from '~/utils/types'

useHead({ title: 'NicoMart — Shop Smart' })

const { getProducts, mediaUrl, errorMessage } = useStrapi()
const notify = useNotify()

// ----- Product data -----
const products = ref<Product[]>([])
const loading = ref(true)
const loadError = ref('')

async function loadProducts() {
  loading.value = true
  loadError.value = ''
  try {
    products.value = await getProducts({ activeOnly: true })
  }
  catch (err) {
    loadError.value = errorMessage(err)
  }
  finally {
    loading.value = false
  }
}
onMounted(loadProducts)

// ----- Search, category filter and sort -----
const search = ref('')
const selectedCategory = ref<string>(ALL_CATEGORIES)
const sortBy = ref('newest')

const categoryOptions = [ALL_CATEGORIES, ...CATEGORIES.map(c => c.value)]
const sortOptions = [
  { title: 'Newest', value: 'newest' },
  { title: 'Price: Low to High', value: 'price-asc' },
  { title: 'Price: High to Low', value: 'price-desc' },
  { title: 'Name: A–Z', value: 'name' },
]

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()

  let list = products.value.filter((p) => {
    const matchesCategory = selectedCategory.value === ALL_CATEGORIES || p.category === selectedCategory.value
    const haystack = `${p.name} ${p.description ?? ''} ${p.category} ${categoryLabel(p.category)}`.toLowerCase()
    const matchesSearch = !q || haystack.includes(q)
    return matchesCategory && matchesSearch
  })

  list = [...list]
  if (sortBy.value === 'price-asc') list.sort((a, b) => Number(a.price) - Number(b.price))
  else if (sortBy.value === 'price-desc') list.sort((a, b) => Number(b.price) - Number(a.price))
  else if (sortBy.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
  return list
})

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of products.value) counts[p.category] = (counts[p.category] ?? 0) + 1
  return counts
})

const hasFilters = computed(() => search.value.trim() !== '' || selectedCategory.value !== ALL_CATEGORIES)

function resetFilters() {
  search.value = ''
  selectedCategory.value = ALL_CATEGORIES
}

function pickCategory(value: string) {
  selectedCategory.value = value
  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
}

// Hero collage uses real product images from Strapi
const heroProducts = computed(() => products.value.filter(p => p.image).slice(0, 3))

// ----- Newsletter (front-end only demo) -----
const newsletterEmail = ref('')
const newsletterForm = ref()
async function subscribe() {
  const { valid } = await newsletterForm.value.validate()
  if (!valid) return
  notify.success(`Thanks! ${newsletterEmail.value} is now subscribed to NicoMart deals.`)
  newsletterEmail.value = ''
  newsletterForm.value.resetValidation()
}
</script>

<template>
  <div>
    <!-- ================= HERO ================= -->
    <section class="hero">
      <v-container class="max-w-page py-12 py-md-16">
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-chip color="secondary" variant="flat" size="small" prepend-icon="mdi-lightning-bolt" class="mb-4">
              New arrivals every week
            </v-chip>
            <h1 class="hero-title">Shop smart.<br>Live better.</h1>
            <p class="hero-sub">
              Gadgets, fashion, home essentials and more — at prices that make sense. Fast delivery and cash on delivery nationwide.
            </p>
            <div class="d-flex flex-wrap ga-3 mt-6">
              <v-btn size="large" color="secondary" variant="flat" rounded="lg" prepend-icon="mdi-shopping" href="#products">
                Shop Now
              </v-btn>
              <v-btn size="large" variant="outlined" color="white" rounded="lg" prepend-icon="mdi-view-dashboard-edit-outline" to="/products">
                Manage Products
              </v-btn>
            </div>
            <div class="d-flex flex-wrap ga-6 mt-8 hero-stats">
              <div><strong>{{ products.length || '—' }}</strong><span>Products</span></div>
              <div><strong>{{ CATEGORIES.length }}</strong><span>Categories</span></div>
              <div><strong>COD</strong><span>Available</span></div>
            </div>
          </v-col>
          <v-col cols="12" md="6" class="d-none d-sm-flex justify-center">
            <div class="collage">
              <template v-if="heroProducts.length">
                <v-card
                  v-for="(p, i) in heroProducts"
                  :key="p.documentId"
                  :class="`collage-item item-${i}`"
                  rounded="xl"
                  elevation="8"
                >
                  <v-img :src="mediaUrl(p.image, 'small') ?? undefined" :alt="p.name" aspect-ratio="1" cover />
                </v-card>
              </template>
              <v-icon v-else icon="mdi-shopping-outline" size="200" color="white" style="opacity: 0.5" />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ================= CATEGORIES ================= -->
    <section id="categories" class="py-12">
      <v-container class="max-w-page">
        <h2 class="section-title">Shop by Category</h2>
        <p class="section-subtitle mb-6">Tap a category to filter the products below.</p>
        <div class="category-grid">
          <div>
            <v-card
              class="category-card text-center pa-4"
              rounded="xl"
              border
              elevation="0"
              :color="selectedCategory === ALL_CATEGORIES ? 'primary' : undefined"
              @click="pickCategory(ALL_CATEGORIES)"
            >
              <v-icon icon="mdi-view-grid-outline" size="32" />
              <div class="text-strong text-small mt-2">All Categories</div>
              <div class="text-tiny dim">{{ products.length }} items</div>
            </v-card>
          </div>
          <div v-for="cat in CATEGORIES" :key="cat.value">
            <v-card
              class="category-card text-center pa-4"
              rounded="xl"
              border
              elevation="0"
              :color="selectedCategory === cat.value ? 'primary' : undefined"
              @click="pickCategory(cat.value)"
            >
              <v-icon :icon="cat.icon" :color="selectedCategory === cat.value ? undefined : cat.color" size="32" />
              <div class="text-strong text-small mt-2">{{ cat.label }}</div>
              <div class="text-tiny dim">{{ categoryCounts[cat.value] ?? 0 }} items</div>
            </v-card>
          </div>
        </div>
      </v-container>
    </section>

    <!-- ================= PROMOTIONS ================= -->
    <section class="pb-12">
      <v-container class="max-w-page">
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="promo promo-main pa-6 pa-md-8 h-100" rounded="xl" elevation="0">
              <v-chip size="small" color="white" variant="flat" class="mb-3">Limited time</v-chip>
              <div class="promo-title">Payday Sale</div>
              <p class="promo-text">Free shipping on orders over ₱1,500 this week. Grab your wishlist items before they sell out!</p>
              <v-btn class="mt-4" color="white" variant="flat" rounded="lg" href="#products" append-icon="mdi-arrow-right">
                See deals
              </v-btn>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-row dense class="h-100">
              <v-col v-for="perk in [
                { icon: 'mdi-truck-fast-outline', title: 'Fast Delivery', text: '2–5 days nationwide' },
                { icon: 'mdi-cash-multiple', title: 'Cash on Delivery', text: 'Pay when it arrives' },
                { icon: 'mdi-shield-check-outline', title: 'Secure Checkout', text: 'Stock-checked orders' },
                { icon: 'mdi-backup-restore', title: 'Easy Returns', text: '7-day return policy' },
              ]" :key="perk.title" cols="6">
                <v-card class="pa-4 h-100" rounded="xl" border elevation="0">
                  <v-avatar color="primary" variant="tonal" rounded="lg"><v-icon :icon="perk.icon" /></v-avatar>
                  <div class="text-strong mt-3">{{ perk.title }}</div>
                  <div class="text-small text-muted">{{ perk.text }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ================= PRODUCTS ================= -->
    <section id="products" class="py-12 bg-surface">
      <v-container class="max-w-page">
        <div class="d-flex flex-wrap align-end justify-space-between ga-2 mb-5">
          <div>
            <h2 class="section-title">Featured Products</h2>
            <p class="section-subtitle">Live from our Strapi catalog.</p>
          </div>
          <v-btn variant="text" prepend-icon="mdi-refresh" :loading="loading" @click="loadProducts">Refresh</v-btn>
        </div>

        <!-- Search + filter toolbar -->
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              label="Search products"
              placeholder="Name, description or category…"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              @click:clear="search = ''"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              :item-title="(v: string) => v === ALL_CATEGORIES ? v : categoryLabel(v)"
              label="Category"
              prepend-inner-icon="mdi-filter-variant"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="sortBy" :items="sortOptions" label="Sort by" prepend-inner-icon="mdi-sort" hide-details />
          </v-col>
        </v-row>

        <v-chip-group v-model="selectedCategory" mandatory selected-class="bg-primary" class="mt-2">
          <v-chip :value="ALL_CATEGORIES" variant="outlined" filter>All Categories</v-chip>
          <v-chip v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value" :prepend-icon="cat.icon" variant="outlined" filter>
            {{ cat.label }}
          </v-chip>
        </v-chip-group>

        <div class="d-flex align-center justify-space-between my-3 text-small text-muted">
          <span v-if="!loading && !loadError">
            Showing {{ filteredProducts.length }} of {{ products.length }} active products
            <template v-if="hasFilters"> · <a href="#" class="text-primary" @click.prevent="resetFilters">clear filters</a></template>
          </span>
        </div>

        <!-- Loading -->
        <v-row v-if="loading">
          <v-col v-for="n in 8" :key="n" cols="12" sm="6" md="4" lg="3">
            <v-skeleton-loader type="image, list-item-two-line, actions" class="rounded-xl" />
          </v-col>
        </v-row>

        <!-- Error -->
        <v-alert v-else-if="loadError" type="error" variant="tonal" rounded="xl" class="my-6" title="Could not load products">
          {{ loadError }}
          <template #append>
            <v-btn color="error" variant="flat" @click="loadProducts">Try again</v-btn>
          </template>
        </v-alert>

        <!-- Empty -->
        <div v-else-if="filteredProducts.length === 0" class="text-center py-12">
          <v-icon icon="mdi-package-variant-closed-remove" size="72" color="grey-lighten-1" />
          <p class="text-strong mt-3">{{ products.length ? 'No products match your search.' : 'No active products yet.' }}</p>
          <p class="text-small text-muted">
            {{ products.length ? 'Try another keyword or choose All Categories.' : 'Add products from the Product Management page.' }}
          </p>
          <v-btn v-if="hasFilters" class="mt-3" color="primary" variant="tonal" @click="resetFilters">Show all products</v-btn>
          <v-btn v-else class="mt-3" color="primary" variant="tonal" to="/products">Manage Products</v-btn>
        </div>

        <!-- Product grid -->
        <v-row v-else>
          <v-col v-for="product in filteredProducts" :key="product.documentId" cols="12" sm="6" md="4" lg="3">
            <ProductCard :product="product" />
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ================= NEWSLETTER ================= -->
    <section class="py-12">
      <v-container class="max-w-page">
        <v-card class="newsletter pa-6 pa-md-10" rounded="xl" elevation="0">
          <v-row align="center">
            <v-col cols="12" md="6">
              <h2 class="section-title text-white">Get exclusive deals in your inbox</h2>
              <p class="text-white mt-2 mb-0" style="opacity: 0.85">Subscribe for weekly promos, restock alerts and new arrivals. No spam.</p>
            </v-col>
            <v-col cols="12" md="6">
              <v-form ref="newsletterForm" class="d-flex flex-column flex-sm-row ga-3" @submit.prevent="subscribe">
                <v-text-field
                  v-model="newsletterEmail"
                  :rules="[rules.required('Email'), rules.email]"
                  label="Email address"
                  type="email"
                  bg-color="white"
                  prepend-inner-icon="mdi-email-outline"
                  validate-on="submit"
                />
                <v-btn type="submit" color="secondary" variant="flat" size="x-large" rounded="lg" height="52">Subscribe</v-btn>
              </v-form>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </section>
  </div>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, #0f766e 0%, #115e59 45%, #1e3a8a 100%);
  color: #fff;
}
.hero-title {
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.02em;
  margin: 0;
}
.hero-sub {
  font-size: 1.1rem;
  opacity: 0.88;
  max-width: 520px;
  margin-top: 16px;
}
.hero-stats div {
  display: flex;
  flex-direction: column;
}
.hero-stats strong {
  font-size: 1.6rem;
}
.hero-stats span {
  opacity: 0.75;
  font-size: 0.85rem;
}
.collage {
  position: relative;
  width: 100%;
  max-width: 440px;
  height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.collage-item {
  position: absolute;
  width: 210px;
}
.collage-item.item-0 { top: 10px; left: 10px; transform: rotate(-6deg); }
.collage-item.item-1 { top: 60px; right: 0; transform: rotate(5deg); z-index: 2; }
.collage-item.item-2 { bottom: 0; left: 90px; transform: rotate(-2deg); z-index: 3; }
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}
.dim {
  opacity: 0.7;
}
.category-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.category-card:hover {
  transform: translateY(-2px);
}
.promo-main {
  background: linear-gradient(120deg, #f59e0b, #ea580c);
  color: #fff;
}
.promo-title {
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight: 800;
}
.promo-text {
  opacity: 0.92;
  max-width: 420px;
}
.newsletter {
  background: linear-gradient(120deg, #1e3a8a, #0f766e);
}
</style>
