export type DeliveryZone = { id: string; name: string; fee: number; weekdays: number[]; deliveryTimes: string[]; available: boolean }
export const zones: DeliveryZone[] = [
  { id: 'centro', name: 'Zona Centro', fee: 0, weekdays: [1, 3, 5], deliveryTimes: ['10:00', '16:00'], available: true },
  { id: 'norte', name: 'Zona Norte', fee: 30, weekdays: [2, 4], deliveryTimes: ['12:00'], available: true },
  { id: 'fuera', name: 'Fuera de cobertura', fee: 0, weekdays: [], deliveryTimes: [], available: false }
]
export function nextDates(weekdays: number[], now = new Date()) {
  const formatter = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  return Array.from({ length: 21 }, (_, index) => { const date = new Date(now); date.setDate(now.getDate() + index + 1); return date })
    .filter(date => weekdays.includes(date.getDay())).slice(0, 3)
    .map(date => ({ date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, label: formatter.format(date) }))
}
