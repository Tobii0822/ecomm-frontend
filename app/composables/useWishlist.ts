/** useWishlist — saved/favorite products (persisted to localStorage). */
import type { Product, WishlistItem } from '~/utils/types'

export function useWishlist() {
  const items = useState<WishlistItem[]>('wishlist', () => [])
  const { mediaUrl } = useStrapi()

  const wishlistCount = computed(() => items.value.length)

  function isWished(documentId: string) {
    return items.value.some(i => i.documentId === documentId)
  }

  function add(product: Product) {
    if (isWished(product.documentId)) return
    items.value.push({
      documentId: product.documentId,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      imageUrl: mediaUrl(product.image, 'thumbnail'),
    })
  }

  function remove(documentId: string) {
    items.value = items.value.filter(i => i.documentId !== documentId)
  }

  /** Adds or removes; returns true if the product is now in the wishlist. */
  function toggle(product: Product): boolean {
    if (isWished(product.documentId)) {
      remove(product.documentId)
      return false
    }
    add(product)
    return true
  }

  function clear() {
    items.value = []
  }

  return { items, wishlistCount, isWished, add, remove, toggle, clear }
}
