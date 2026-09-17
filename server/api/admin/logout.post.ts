import { closeAdminSession } from '../../utils/adminAuth'
export default defineEventHandler(event => { closeAdminSession(event); return { authenticated: false } })
