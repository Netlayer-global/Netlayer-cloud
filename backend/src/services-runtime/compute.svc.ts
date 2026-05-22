/**
 * compute-svc — server CRUD, snapshots, firewall rules, SSH keys, catalog.
 *
 * Standalone:  npm run svc:compute
 */

import 'dotenv/config'
import { config } from '../config/env'
import { createService } from './createService'
import { authMiddleware } from '../middleware/auth'
import { idempotency } from '../middleware/idempotency'
import serverRoutes from '../routes/servers.routes'
import sshRoutes from '../routes/ssh.routes'
import planRoutes from '../routes/plans.routes'

const PORT = parseInt(process.env.COMPUTE_SVC_PORT || '5003', 10)

if (require.main === module) {
  createService({
    name: 'compute-svc',
    port: PORT,
    mount: (app) => {
      app.use('/api', planRoutes) // public catalog
      app.use('/api/servers', authMiddleware, idempotency(), serverRoutes)
      app.use('/api/ssh-keys', authMiddleware, idempotency(), sshRoutes)
    },
  })
  void config
}
