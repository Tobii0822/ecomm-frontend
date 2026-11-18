<script setup lang="ts">
/**
 * Create / Edit product dialog.
 * Image upload flow (Strapi 5):
 *   1. POST /api/upload (FormData "files")  → returns [{ id, url, ... }]
 *   2. POST/PUT /api/products with data.image = <uploaded id>
 */
import type { Product, ProductInput } from '~/utils/types'

const props = defineProps<{ product: Product | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ (e: 'saved', product: Product, mode: 'created' | 'updated'): void }>()

const { createProduct, updateProduct, uploadImage, mediaUrl, errorMessage } = useStrapi()

const isEdit = computed(() => !!props.product)
const formRef = ref()
const saving = ref(false)
const error = ref('')

const MAX_IMAGE_MB = 5

const form = reactive({
  name: '',
  description: '',
  price: '' as string | number,
  stock: '' as string | number,
  category: 'Electronics',
  isActive: true,
})
const imageFile = ref<File | File[] | null>(null)
const removeImage = ref(false)
const previewUrl = ref<string | null>(null)

const selectedFile = computed<File | null>(() => {
  const v = imageFile.value
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
})

const existingImageUrl = computed(() => (props.product?.image && !removeImage.value) ? mediaUrl(props.product.image, 'small') : null)
const shownImage = computed(() => previewUrl.value ?? existingImageUrl.value)

// Local preview of a newly chosen file
watch(selectedFile, (file) => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = file ? URL.createObjectURL(file) : null
  if (file) removeImage.value = false
})

// Fill the form every time the dialog opens
watch(open, (isOpen) => {
  if (!isOpen) return
  error.value = ''
  imageFile.value = null
  removeImage.value = false
  const p = props.product
  form.name = p?.name ?? ''
  form.description = p?.description ?? ''
  form.price = p ? Number(p.price) : ''
  form.stock = p ? p.stock : ''
  form.category = p?.category ?? 'Electronics'
  form.isActive = p?.isActive ?? true
  nextTick(() => formRef.value?.resetValidation())
}, { immediate: true })

const imageRules = [
  (v: File | File[] | null) => {
    const f = Array.isArray(v) ? v[0] : v
    if (!f) return true
    if (!f.type.startsWith('image/')) return 'Please choose an image file (JPG, PNG, WEBP, GIF).'
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) return `Image must be ${MAX_IMAGE_MB} MB or smaller.`
    return true
  },
]

/** Builds a readable message, including Strapi validation details if present. */
function describeError(err: any) {
  const list = err?.data?.error?.details?.errors
  if (Array.isArray(list) && list.length) {
    return list.map((e: any) => `${(e.path ?? []).join('.') || 'field'}: ${e.message}`).join(' · ')
  }
  return errorMessage(err)
}

async function save() {
  error.value = ''
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    // 1) Upload the new image first (if one was chosen)
    let image: number | null | undefined
    if (selectedFile.value) {
      const uploaded = await uploadImage(selectedFile.value)
      image = uploaded.id
    }
    else if (removeImage.value) {
      image = null
    }

    // 2) Create or update the product
    const payload: ProductInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      isActive: form.isActive,
      ...(image !== undefined ? { image } : {}),
    }

    const saved = isEdit.value
      ? await updateProduct(props.product!.documentId, payload)
      : await createProduct(payload)

    emit('saved', saved, isEdit.value ? 'updated' : 'created')
    open.value = false
  }
  catch (err) {
    error.value = describeError(err)
  }
  finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <v-dialog v-model="open" max-width="760" scrollable :persistent="saving">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center ga-2 pt-4 px-6">
        <v-icon :icon="isEdit ? 'mdi-pencil-outline' : 'mdi-plus-box-outline'" color="primary" />
        {{ isEdit ? 'Edit Product' : 'Add New Product' }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" :disabled="saving" aria-label="Close" @click="open = false" />
      </v-card-title>
      <v-divider />

      <v-card-text class="px-6 pt-5">
        <v-form ref="formRef" @submit.prevent="save">
          <v-row>
            <!-- Image -->
            <v-col cols="12" sm="5">
              <div class="image-box d-flex align-center justify-center mb-3">
                <v-img v-if="shownImage" :src="shownImage" aspect-ratio="1" cover class="rounded-lg" />
                <div v-else class="text-center text-muted">
                  <v-icon icon="mdi-image-plus" size="48" />
                  <div class="text-tiny mt-1">No image selected</div>
                </div>
              </div>
              <v-file-input
                v-model="imageFile"
                label="Product image"
                accept="image/*"
                prepend-icon=""
                prepend-inner-icon="mdi-camera"
                :rules="imageRules"
                show-size
                clearable
                :hint="`JPG, PNG, WEBP or GIF · max ${MAX_IMAGE_MB} MB`"
                persistent-hint
              />
              <v-checkbox
                v-if="isEdit && product?.image && !selectedFile"
                v-model="removeImage"
                label="Remove current image"
                density="compact"
                hide-details
                color="error"
              />
            </v-col>

            <!-- Details -->
            <v-col cols="12" sm="7">
              <v-text-field
                v-model="form.name"
                label="Product name *"
                :rules="[rules.required('Product name'), rules.maxLength(120, 'Product name')]"
                counter="120"
                class="mb-1"
              />
              <v-textarea
                v-model="form.description"
                label="Description"
                rows="3"
                auto-grow
                :rules="[rules.maxLength(1000, 'Description')]"
                class="mb-1"
              />
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.price"
                    label="Price (₱) *"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="₱"
                    :rules="[rules.required('Price'), rules.nonNegativeNumber('Price')]"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.stock"
                    label="Stock *"
                    type="number"
                    min="0"
                    step="1"
                    :rules="[rules.required('Stock'), rules.nonNegativeInteger('Stock')]"
                  />
                </v-col>
              </v-row>
              <v-select
                v-model="form.category"
                :items="[...CATEGORIES]"
                item-title="label"
                item-value="value"
                label="Category *"
                :rules="[rules.required('Category')]"
              />
              <v-switch
                v-model="form.isActive"
                color="success"
                inset
                hide-details
                :label="form.isActive ? 'Active — visible on the homepage' : 'Inactive — hidden from shoppers'"
              />
            </v-col>
          </v-row>

          <v-alert v-if="error" type="error" variant="tonal" class="mt-3" :text="error" />
        </v-form>
      </v-card-text>

      <v-divider />
      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="open = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" prepend-icon="mdi-content-save-outline" @click="save">
          {{ isEdit ? 'Save Changes' : 'Create Product' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.image-box {
  aspect-ratio: 1;
  width: 100%;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
}
</style>
