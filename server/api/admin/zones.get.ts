import { store } from '../../data/store'
import { requireAdmin } from '../../utils/adminAuth'
export default defineEventHandler(event => { requireAdmin(event); return store.zones })
