/**
 * auth-svc — handles registration, login, refresh, sessions, 2FA.
 *
 * Run standalone:
 *   npm run svc:auth
 *
 * Or in-process via the monolith (default until we deploy services separately).
 */

import 'dotenv/config'
import { config } from '../config/env'
import { createService } from './createService'
import authRoutes from '../routes/auth.routes'
import { idempotency } from '../middleware/idempotency'

const PORT = parseInt(process.env.AUTH_SVC_PORT || '5001', 10)

if (require.main === module) {
  createService({
    name: 'auth-svc',
    port: PORT,
    mount: (app) => {
      app.use('/api/auth', idempotency(), authRoutes)
    },
  })
  void config
}
