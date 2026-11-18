/**
 * useCart — shopping cart state shared by every page/component.
 *
 * - Stored with useState (shared reactive state) and saved to localStorage
 *   by plugins/persist.client.ts so the cart survives a page refresh.
 * - Quantity can never go above the product's available stock.
 */
import type { CartItem, Product } from '~/utils/types'

export function useCart() {
  const items = useState<CartItem[]>('cart', () => [])
  const { mediaUrl } = useStrapi()

  // ----- Derived values (computed) -----
  /** Number of different products in the cart (shown on the badge) */
  const cartCount = computed(() => items.value.length)
  /** Sum of all quantities */
  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  /** Sum of price × quantity for all items */
  const totalAmount = computed(() => round2(items.value.reduce((sum, i) => sum + subtotal(i), 0)))
  /** Items that cannot be checked out (inactive, out of stock, or qty > stock) */
  const invalidItems = computed(() => items.value.filter(i => !i.isActive || i.stock <= 0 || i.quantity > i.stock))

  function subtotal(item: CartItem) {
    return round2(item.price * item.quantity)
  }

  function find(documentId: string) {
    return items.value.find(i => i.documentId === documentId)
  }

  function quantityInCart(documentId: string) {
    return find(documentId)?.quantity ?? 0
  }

  /** Adds a product. Returns { ok, message } so the caller can show feedback. */
  function addToCart(product: Product, quantity = 1): { ok: boolean, message: string } {
    if (!product.isActive) return { ok: false, message: `"${product.name}" is not available.` }
    if (product.stock <= 0) return { ok: false, message: `"${product.name}" is out of stock.` }

    const existing = find(product.documentId)
    const current = existing?.quantity ?? 0
    if (current + quantity > product.stock) {
      return { ok: false, message: `Only ${product.stock} of "${product.name}" available — you already have ${current} in your cart.` }
    }

    if (existing) {
      existing.quantity += quantity
      existing.stock = product.stock
      existing.price = Number(product.price)
    }
    else {
      items.value.push({
        documentId: product.documentId,
        name: product.name,
        category: product.category,
        price: Number(product.price),
        stock: product.stock,
        isActive: product.isActive,
        imageUrl: mediaUrl(product.image, 'thumbnail'),
        quantity,
      })
    }
    return { ok: true, message: `Added "${product.name}" to cart.` }
  }

  /** Sets an exact quantity (clamped between 1 and stock). */
  function updateQuantity(documentId: string, quantity: number): { ok: boolean, message?: string } {
    const item = find(documentId)
    if (!item) return { ok: false }
    const q = Math.floor(Number(quantity))
    if (!Number.isFinite(q) || q < 1) {
      item.quantity = 1
      return { ok: false, message: 'Quantity must be at least 1.' }
    }
    if (q > item.stock) {
      item.quantity = Math.max(1, item.stock)
      return { ok: false, message: `Only ${item.stock} of "${item.name}" in stock.` }
    }
    item.quantity = q
    return { ok: true }
  }

  function increment(documentId: string) {
    const item = find(documentId)
    return item ? updateQuantity(documentId, item.quantity + 1) : { ok: false }
  }

  function decrement(documentId: string) {
    const item = find(documentId)
    if (item && item.quantity > 1) item.quantity--
  }

  function removeFromCart(documentId: string) {
    items.value = items.value.filter(i => i.documentId !== documentId)
  }

  function clearCart() {
    items.value = []
  }

  /**
   * Updates cart items with the latest product data from Strapi
   * (price, stock, active flag). Removes products that were deleted.
   * Returns human-readable notes about anything that changed.
   */
  function syncWithProducts(products: Product[]): string[] {
    const notes: string[] = []
    const byId = new Map(products.map(p => [p.documentId, p]))
    const kept: CartItem[] = []

    for (const item of items.value) {
      const p = byId.get(item.documentId)
      if (!p) {
        notes.push(`"${item.name}" was removed because it no longer exists.`)
        continue
      }
      item.name = p.name
      item.price = Number(p.price)
      item.stock = p.stock
      item.isActive = p.isActive
      item.category = p.category
      item.imageUrl = mediaUrl(p.image, 'thumbnail') ?? item.imageUrl
      if (!p.isActive) notes.push(`"${p.name}" is no longer available.`)
      else if (p.stock <= 0) notes.push(`"${p.name}" is now out of stock.`)
      else if (item.quantity > p.stock) notes.push(`Only ${p.stock} of "${p.name}" left — please lower the quantity.`)
      kept.push(item)
    }
    items.value = kept
    return notes
  }

  return {
    items,
    cartCount,
    totalItems,
    totalAmount,
    invalidItems,
    subtotal,
    quantityInCart,
    addToCart,
    updateQuantity,
    increment,
    decrement,
    removeFromCart,
    clearCart,
    syncWithProducts,
  }
}
