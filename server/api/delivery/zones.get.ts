import { nextDates } from '../../data/delivery'
import { store } from '../../data/store'
export default defineEventHandler(() => store.zones.map(zone => ({ id: zone.id, name: zone.name, fee: zone.fee, available: zone.available, dates: zone.available ? nextDates(zone.weekdays) : [], deliveryTimes: zone.available ? zone.deliveryTimes : [] })))
