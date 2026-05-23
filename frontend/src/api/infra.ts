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


// ─── MANAGED DATABASES ─────────────────────────────────────
export interface ManagedDatabase {
  id: string
  name: string
  engine: 'postgresql' | 'mysql' | 'redis'
  version: string
  planId: string
  region: string
  status: 'creating' | 'available' | 'deleting' | 'error'
  host: string | null
  port: number | null
  database: string | null
  username: string | null
  password?: string  // Only present on detail / rotate-password responses
  hasPassword: boolean
  backupEnabled: boolean
  connectionString: string | null
  createdAt: string
}

export interface DbEngineSpec {
  engine: string
  versions: string[]
  port: number
}

export const databasesAPI = {
  engines: () => api.get<{ data: DbEngineSpec[] }>('/databases/engines'),
  list: () => api.get<{ data: ManagedDatabase[] }>('/databases'),
  get: (id: string) => api.get<{ data: ManagedDatabase }>(`/databases/${id}`),
  create: (data: {
    name: string; engine: string; version: string; planId: string; region: string; backupEnabled?: boolean
  }) => api.post<{ data: ManagedDatabase }>('/databases', data),
  update: (id: string, data: { backupEnabled?: boolean }) =>
    api.patch<{ data: ManagedDatabase }>(`/databases/${id}`, data),
  rotatePassword: (id: string) =>
    api.post<{ data: ManagedDatabase }>(`/databases/${id}/rotate-password`),
  delete: (id: string) => api.delete(`/databases/${id}`),
}

// ─── VPC ────────────────────────────────────────────────────
export interface VPCMember {
  id: string
  vpcId: string
  serverId: string
  privateIp: string
  server?: {
    id: string
    name: string
    ipv4: string | null
    status: string
    regionId?: string
  }
}

export interface VPC {
  id: string
  name: string
  region: string
  cidr: string
  isDefault: boolean
  createdAt: string
  members: VPCMember[]
}

export const vpcAPI = {
  list: () => api.get<{ data: VPC[] }>('/vpc'),
  get: (id: string) => api.get<{ data: VPC }>(`/vpc/${id}`),
  create: (data: { name: string; region: string; cidr?: string; isDefault?: boolean }) =>
    api.post<{ data: VPC }>('/vpc', data),
  delete: (id: string) => api.delete(`/vpc/${id}`),
  addMember: (id: string, serverId: string) =>
    api.post<{ data: VPCMember }>(`/vpc/${id}/members`, { serverId }),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/vpc/${id}/members/${memberId}`),
}

// ─── DNS ────────────────────────────────────────────────────
export interface DnsRecord {
  id: string
  zoneId: string
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'
  name: string
  content: string
  ttl: number
  priority: number | null
  createdAt: string
}

export interface DnsZone {
  id: string
  domain: string
  status: string
  createdAt: string
  records?: DnsRecord[]
  _count?: { records: number }
}

export const dnsAPI = {
  listZones: () => api.get<{ data: DnsZone[] }>('/dns/zones'),
  getZone: (id: string) => api.get<{ data: DnsZone }>(`/dns/zones/${id}`),
  createZone: (domain: string) =>
    api.post<{ data: DnsZone }>('/dns/zones', { domain }),
  deleteZone: (id: string) => api.delete(`/dns/zones/${id}`),
  createRecord: (zoneId: string, data: {
    type: string; name: string; content: string; ttl?: number; priority?: number
  }) => api.post<{ data: DnsRecord }>(`/dns/zones/${zoneId}/records`, data),
  updateRecord: (zoneId: string, recordId: string, data: any) =>
    api.patch<{ data: DnsRecord }>(`/dns/zones/${zoneId}/records/${recordId}`, data),
  deleteRecord: (zoneId: string, recordId: string) =>
    api.delete(`/dns/zones/${zoneId}/records/${recordId}`),
}
