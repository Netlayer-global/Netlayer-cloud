import { io, Socket } from 'socket.io-client'

/**
 * Single socket instance for the public site. Used by the status page to
 * receive `status:update` events as incidents change. No auth — only
 * subscribes to public channels.
 */
let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: false,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
