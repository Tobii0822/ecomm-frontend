const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

/** 1499 → "₱1,499.00" */
export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value)
  return peso.format(Number.isFinite(n) ? n : 0)
}

/** Avoids floating point issues like 0.1 + 0.2 = 0.30000000000000004 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Shared validation rules for Vuetify inputs (return true or an error message). */
export const rules = {
  required: (label = 'This field') => (v: unknown) =>
    (v !== null && v !== undefined && String(v).trim() !== '') || `${label} is required.`,
  minLength: (min: number, label = 'This field') => (v: string) =>
    (String(v ?? '').trim().length >= min) || `${label} must be at least ${min} characters.`,
  maxLength: (max: number, label = 'This field') => (v: string) =>
    (String(v ?? '').length <= max) || `${label} must be at most ${max} characters.`,
  nonNegativeNumber: (label = 'Value') => (v: unknown) =>
    (v !== '' && v !== null && Number.isFinite(Number(v)) && Number(v) >= 0) || `${label} must be 0 or higher.`,
  nonNegativeInteger: (label = 'Value') => (v: unknown) =>
    (v !== '' && v !== null && Number.isInteger(Number(v)) && Number(v) >= 0) || `${label} must be a whole number (0 or higher).`,
  phMobile: (v: string) =>
    /^(09\d{9}|\+639\d{9})$/.test(String(v ?? '').replace(/[\s-]/g, '')) || 'Use 09XXXXXXXXX or +639XXXXXXXXX.',
  email: (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? '').trim()) || 'Enter a valid email address.',
}
