/**
 * admin-svc — admin API for staff (super admins, support, billing).
 *
 * Standalone:  npm run svc:admin
 */

import 'dotenv/config'
import { config } from '../config/env'
import { createService } from './createService'
import { authMiddleware } from '../middleware/auth'
import { idempotency } from '../middleware/idempotency'
import adminRoutes from '../routes/admin.routes'

const PORT = parseInt(process.env.ADMIN_SVC_PORT || '5004', 10)

if (require.main === module) {
  createService({
    name: 'admin-svc',
    port: PORT,
    mount: (app) => {
      app.use('/api/admin', authMiddleware, idempotency(), adminRoutes)
    },
  })
  void config
}
