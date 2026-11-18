/**
 * useStrapi — every call to the Strapi 5 REST API goes through here.
 *
 * Strapi 5 notes:
 *  - Records are identified by `documentId` (a string), not the numeric `id`.
 *  - Responses are flat: { data: { documentId, name, price, ... }, meta }.
 *  - Relations/media are NOT included unless requested: ?populate=image
 */
import type { CheckoutForm, Product, ProductInput, StrapiMedia } from '~/utils/types'

interface ListResponse<T> {
  data: T[]
  meta: { pagination: { page: number, pageSize: number, pageCount: number, total: number } }
}
interface SingleResponse<T> { data: T }

export function useStrapi() {
  const config = useRuntimeConfig()
  const baseUrl = String(config.public.strapiUrl).replace(/\/$/, '')

  // A $fetch instance that always prefixes /api
  const api = $fetch.create({ baseURL: `${baseUrl}/api` })

  /** Turns "/uploads/x.png" into "http://localhost:1337/uploads/x.png". */
  function mediaUrl(media?: StrapiMedia | null, size: 'thumbnail' | 'small' | 'medium' | 'original' = 'small'): string | null {
    if (!media?.url) return null
    const url = size !== 'original' && media.formats?.[size]?.url ? media.formats[size].url : media.url
    return url.startsWith('http') ? url : `${baseUrl}${url}`
  }

  /** Extracts a readable message from a Strapi/network error. */
  function errorMessage(err: any, fallback = 'Something went wrong. Please try again.'): string {
    if (err?.data?.error?.message) return err.data.error.message
    if (err?.name === 'FetchError' && !err?.response) return 'Cannot reach the server. Is Strapi running on ' + baseUrl + '?'
    return err?.message || fallback
  }

  // ---------- Products ----------

  /** GET /api/products?populate=image (+ optional filters) */
  async function getProducts(opts: { activeOnly?: boolean, search?: string, category?: string, isActive?: boolean | null } = {}) {
    const query: Record<string, string | number | boolean> = {
      'populate': 'image',
      'sort': 'createdAt:desc',
      'pagination[pageSize]': 200,
    }
    if (opts.activeOnly) query['filters[isActive][$eq]'] = true
    if (opts.isActive === true || opts.isActive === false) query['filters[isActive][$eq]'] = opts.isActive
    if (opts.category) query['filters[category][$eq]'] = opts.category
    if (opts.search?.trim()) {
      // Search name OR description OR category (case-insensitive "contains")
      query['filters[$or][0][name][$containsi]'] = opts.search.trim()
      query['filters[$or][1][description][$containsi]'] = opts.search.trim()
      query['filters[$or][2][category][$containsi]'] = opts.search.trim()
    }
    const res = await api<ListResponse<Product>>('/products', { query })
    return res.data
  }

  /** GET /api/products?filters[documentId][$in]=... — fresh data for items in the cart */
  async function getProductsByIds(documentIds: string[]) {
    if (!documentIds.length) return []
    const query: Record<string, string | number> = { 'populate': 'image', 'pagination[pageSize]': 200 }
    documentIds.forEach((id, i) => { query[`filters[documentId][$in][${i}]`] = id })
    const res = await api<ListResponse<Product>>('/products', { query })
    return res.data
  }

  /** GET /api/products/:documentId?populate=image */
  async function getProduct(documentId: string) {
    const res = await api<SingleResponse<Product>>(`/products/${documentId}`, { query: { populate: 'image' } })
    return res.data
  }

  /** POST /api/products  body: { data: {...} } */
  async function createProduct(data: ProductInput) {
    const res = await api<SingleResponse<Product>>('/products', { method: 'POST', body: { data } })
    return res.data
  }

  /** PUT /api/products/:documentId  body: { data: {...} } */
  async function updateProduct(documentId: string, data: Partial<ProductInput>) {
    const res = await api<SingleResponse<Product>>(`/products/${documentId}`, { method: 'PUT', body: { data } })
    return res.data
  }

  /** DELETE /api/products/:documentId */
  async function deleteProduct(documentId: string) {
    await api(`/products/${documentId}`, { method: 'DELETE' })
  }

  // ---------- Media ----------

  /** POST /api/upload (multipart/form-data, field name "files") → returns the uploaded file (with numeric id) */
  async function uploadImage(file: File) {
    const form = new FormData()
    form.append('files', file)
    const res = await api<StrapiMedia[]>('/upload', { method: 'POST', body: form })
    if (!res?.[0]) throw new Error('Image upload failed.')
    return res[0]
  }

  // ---------- Checkout ----------

  /** POST /api/orders/checkout — validates stock & deducts it on the server */
  async function checkout(customer: CheckoutForm, items: { documentId: string, quantity: number }[]) {
    return api<{ data: any, meta: { message: string } }>('/orders/checkout', {
      method: 'POST',
      body: { data: { ...customer, items } },
    })
  }

  return {
    baseUrl,
    mediaUrl,
    errorMessage,
    getProducts,
    getProductsByIds,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
    checkout,
  }
}
