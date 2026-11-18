/** Shape of a Strapi 5 media file (only the fields we use). */
export interface StrapiMedia {
  id: number
  documentId?: string
  url: string
  alternativeText?: string | null
  formats?: Record<string, { url: string, width: number, height: number }> | null
}

/** Product as returned by GET /api/products?populate=image (Strapi 5 = flat response, no "attributes"). */
export interface Product {
  id: number
  documentId: string
  name: string
  description?: string | null
  price: number | string
  stock: number
  category: string
  isActive: boolean
  image?: StrapiMedia | null
  createdAt?: string
  updatedAt?: string
}

/** Fields we send when creating/updating a product. */
export interface ProductInput {
  name: string
  description: string
  price: number
  stock: number
  category: string
  isActive: boolean
  image?: number | null
}

export interface CartItem {
  documentId: string
  name: string
  category: string
  price: number
  stock: number
  isActive: boolean
  imageUrl: string | null
  quantity: number
}

export interface WishlistItem {
  documentId: string
  name: string
  category: string
  price: number
  imageUrl: string | null
}

export interface CheckoutForm {
  fullName: string
  contactNumber: string
  deliveryAddress: string
  paymentMethod: string
}

export interface CheckoutProblem {
  documentId: string
  name?: string
  reason: 'NOT_FOUND' | 'INACTIVE' | 'INSUFFICIENT_STOCK'
  available?: number
  requested?: number
  message: string
}
