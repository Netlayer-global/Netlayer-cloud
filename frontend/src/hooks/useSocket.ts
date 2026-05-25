import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'

let connected = false

export function useSocket() {
  const qc = useQueryClient()
  const { accessToken, user } = useAuthStore()

  useEffect(() => {
    if (!accessToken || connected) return
    const socket = getSocket()

    const onConnect = () => {
      socket.emit('authenticate', accessToken)
    }
    if (socket.connected) onConnect()
    socket.on('connect', onConnect)

    socket.on('authenticated', () => {
      connected = true
    })

    socket.on('server:status', (payload: any) => {
      qc.invalidateQueries({ queryKey: ['servers'] })
      if (payload.serverId) {
        qc.invalidateQueries({ queryKey: ['server', payload.serverId] })
      }
    })

    socket.on('server:alert', (payload: any) => {
      toast.error(payload.message || 'Server alert')
    })

    socket.on('admin:alert', (payload: any) => {
      if (user?.role && ['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        toast.warning(payload.message || 'Admin alert')
      }
    })

    socket.on('admin:server_update', () => {
      qc.invalidateQueries({ queryKey: ['admin-servers'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    })

    // Round 19: real-time notification push
    socket.on('notification', (payload: any) => {
      qc.setQueryData(['notifications'], (old: any) => {
        const items = [payload, ...((old?.data as any[]) ?? [])].slice(0, 50)
        return { ...(old || {}), data: items, unreadCount: ((old?.unreadCount as number) ?? 0) + 1 }
      })
      // Toast for the user; never block on it.
      try {
        toast(payload.title, {
          description: payload.message,
          duration: 5000,
        })
      } catch {}
    })

    socket.on('node:offline', (payload: any) => {
      if (user?.role && ['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        toast.error(`Node ${payload.name} is OFFLINE`)
      }
    })

    return () => {
      socket.off('connect', onConnect)
      socket.off('authenticated')
      socket.off('server:status')
      socket.off('server:alert')
      socket.off('admin:alert')
      socket.off('admin:server_update')
      socket.off('notification')
      socket.off('node:offline')
    }
  }, [accessToken, qc, user])
}
