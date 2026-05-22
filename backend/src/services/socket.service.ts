import { Server as IOServer } from 'socket.io'
import { verifyAccessToken } from '../utils/jwt'
import logger from '../utils/logger'

let io: IOServer | null = null

export function setIo(instance: IOServer) {
  io = instance

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`)

    socket.on('authenticate', (token: string) => {
      try {
        const payload = verifyAccessToken(token)
        socket.data.userId = payload.userId
        socket.data.role = payload.role
        socket.join(`user:${payload.userId}`)
        if (['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING'].includes(payload.role)) {
          socket.join('admin')
        }
        socket.emit('authenticated', { userId: payload.userId, role: payload.role })
      } catch {
        socket.emit('auth_error', { error: 'Invalid token' })
        socket.disconnect()
      }
    })

    socket.on('subscribe:server', (serverId: string) => {
      socket.join(`server:${serverId}`)
    })

    socket.on('unsubscribe:server', (serverId: string) => {
      socket.leave(`server:${serverId}`)
    })

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`)
    })
  })
}

export function getIo(): IOServer {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export function emitServerStatus(serverId: string, payload: Record<string, any>) {
  io?.to(`server:${serverId}`).emit('server:status', { serverId, ...payload })
  io?.to('admin').emit('admin:server_update', { serverId, ...payload })
}

export function emitToUser(userId: string, event: string, payload: any) {
  io?.to(`user:${userId}`).emit(event, payload)
}

export function emitToAdmin(event: string, payload: any) {
  io?.to('admin').emit(event, payload)
}
