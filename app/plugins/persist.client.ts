/**
 * Saves the cart and wishlist to localStorage and restores them on load.
 * ".client" in the file name = this plugin only runs in the browser.
 */
import type { CartItem, WishlistItem } from '~/utils/types'

const CART_KEY = 'nicomart:cart'
const WISHLIST_KEY = 'nicomart:wishlist'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  }
  catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // storage full or disabled — the app still works, it just won't remember
  }
}

export default defineNuxtPlugin(() => {
  const cart = useState<CartItem[]>('cart', () => [])
  const wishlist = useState<WishlistItem[]>('wishlist', () => [])

  const savedCart = load<CartItem[]>(CART_KEY, [])
  const savedWishlist = load<WishlistItem[]>(WISHLIST_KEY, [])
  cart.value = Array.isArray(savedCart) ? savedCart.filter(i => i?.documentId && i.quantity > 0) : []
  wishlist.value = Array.isArray(savedWishlist) ? savedWishlist.filter(i => i?.documentId) : []

  watch(cart, v => save(CART_KEY, v), { deep: true })
  watch(wishlist, v => save(WISHLIST_KEY, v), { deep: true })
})
