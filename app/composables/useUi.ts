/** Shared open/close state for the cart and wishlist drawers. */
export function useUi() {
  const cartOpen = useState('ui:cartOpen', () => false)
  const wishlistOpen = useState('ui:wishlistOpen', () => false)
  return { cartOpen, wishlistOpen }
}
