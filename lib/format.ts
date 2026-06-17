export type Role = 'admin' | 'kasiyer' | 'garson' | 'mutfak'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Yönetici',
  kasiyer: 'Kasiyer',
  garson: 'Garson',
  mutfak: 'Mutfak',
}

export function formatTL(value: number | string) {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0)
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}
