import api from './client'

// ─── BLOCK VOLUMES ─────────────────────────────────────────
export interface BlockVolume {
  id: string
  name: string
  sizeGB: number
  region: string
  status: 'available' | 'attached' | 'detaching' | 'deleting'
  serverId: string | null
  proxmoxDisk: string | null
  createdAt: string
  server?: {
    id: string
    name: string
    hostname: string
    ipv4: string | null
    status: string
  } | null
}

export const volumesAPI = {
  list: () => api.get<{ data: BlockVolume[] }>('/volumes'),
  get: (id: string) => api.get<{ data: BlockVolume }>(`/volumes/${id}`),
  create: (data: { name: string; sizeGB: number; region: string }) =>
    api.post<{ data: BlockVolume }>('/volumes', data),
  update: (id: string, data: { name?: string; sizeGB?: number }) =>
    api.patch<{ data: BlockVolume }>(`/volumes/${id}`, data),
  attach: (id: string, serverId: string) =>
    api.post<{ data: BlockVolume }>(`/volumes/${id}/attach`, { serverId }),
  detach: (id: string) =>
    api.post<{ data: BlockVolume }>(`/volumes/${id}/detach`),
  delete: (id: string) => api.delete(`/volumes/${id}`),
}

// ─── LOAD BALANCERS ────────────────────────────────────────
export interface LoadBalancerTarget {
  id: string
  loadBalancerId: string
  serverId: string
  port: number
  weight: number
  isHealthy: boolean
  server?: {
    id: string
    name: string
    ipv4: string | null
    status: string
    regionId?: string
  }
}

export interface LoadBalancer {
  id: string
  name: string
  region: string
  algorithm: 'round_robin' | 'least_connections' | 'ip_hash'
  ipv4: string | null
  protocol: 'HTTP' | 'HTTPS' | 'TCP'
  port: number
  healthCheck: {
    path?: string
    interval?: number
    timeout?: number
    healthyThreshold?: number
    unhealthyThreshold?: number
    protocol?: 'HTTP' | 'HTTPS' | 'TCP'
    port?: number
  }
  status: string
  createdAt: string
  targets: LoadBalancerTarget[]
}

export const loadBalancersAPI = {
  list: () => api.get<{ data: LoadBalancer[] }>('/load-balancers'),
  get: (id: string) => api.get<{ data: LoadBalancer }>(`/load-balancers/${id}`),
  create: (data: {
    name: string
    region: string
    algorithm?: string
    protocol?: string
    port?: number
    healthCheck?: any
  }) => api.post<{ data: LoadBalancer }>('/load-balancers', data),
  update: (id: string, data: any) =>
    api.patch<{ data: LoadBalancer }>(`/load-balancers/${id}`, data),
  delete: (id: string) => api.delete(`/load-balancers/${id}`),
  addTarget: (id: string, serverId: string, port?: number, weight?: number) =>
    api.post<{ data: LoadBalancerTarget }>(`/load-balancers/${id}/targets`, { serverId, port, weight }),
  removeTarget: (id: string, targetId: string) =>
    api.delete(`/load-balancers/${id}/targets/${targetId}`),
}
