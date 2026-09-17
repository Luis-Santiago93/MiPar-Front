import { isAdmin } from '../../utils/adminAuth'
export default defineEventHandler(event => ({ authenticated: isAdmin(event) }))
