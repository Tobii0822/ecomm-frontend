/**
 * Categories must match the "category" enumeration in
 * backend/src/api/product/content-types/product/schema.json
 */
export const CATEGORIES = [
  { value: 'Electronics', label: 'Electronics', icon: 'mdi-headphones', color: 'teal' },
  { value: 'Fashion', label: 'Fashion', icon: 'mdi-tshirt-crew', color: 'indigo' },
  { value: 'Home', label: 'Home & Living', icon: 'mdi-sofa-single', color: 'orange' },
  { value: 'Beauty', label: 'Beauty', icon: 'mdi-lipstick', color: 'pink' },
  { value: 'Sports', label: 'Sports', icon: 'mdi-basketball', color: 'red' },
  { value: 'Books', label: 'Books', icon: 'mdi-book-open-page-variant', color: 'deep-purple' },
  { value: 'Groceries', label: 'Groceries', icon: 'mdi-basket', color: 'green' },
  { value: 'Toys', label: 'Toys', icon: 'mdi-puzzle', color: 'amber-darken-2' },
] as const

export const ALL_CATEGORIES = 'All Categories'

export const PAYMENT_METHODS = [
  { value: 'Cash on Delivery', icon: 'mdi-cash', hint: 'Pay when your order arrives' },
  { value: 'GCash', icon: 'mdi-cellphone', hint: 'E-wallet payment' },
  { value: 'Credit/Debit Card', icon: 'mdi-credit-card-outline', hint: 'Visa / Mastercard' },
  { value: 'Bank Transfer', icon: 'mdi-bank-outline', hint: 'Online banking' },
] as const

export const LOW_STOCK_THRESHOLD = 5

export function categoryLabel(value: string): string {
  return CATEGORIES.find(c => c.value === value)?.label ?? value
}

export function categoryIcon(value: string): string {
  return CATEGORIES.find(c => c.value === value)?.icon ?? 'mdi-tag-outline'
}
