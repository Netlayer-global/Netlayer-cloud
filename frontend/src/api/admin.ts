import api from './client'

export const adminAPI = {
  // Dashboard
  stats: () => api.get('/admin/stats').then((r) => r.data.data),
  revenueChart: (period: '7d' | '30d' | '90d' = '30d') =>
    api.get(`/admin/revenue-chart?period=${period}`).then((r) => r.data.data),
  activityFeed: () => api.get('/admin/activity-feed').then((r) => r.data.data),

  // Users
  listUsers: (params: { page?: number; search?: string; status?: string; country?: string; role?: string } = {}) =>
    api.get('/admin/users', { params }).then((r) => r.data),
  getUser: (id: string) => api.get(`/admin/users/${id}`).then((r) => r.data.data),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data).then((r) => r.data.data),
  adjustBalance: (id: string, amount: number, reason: string, type: 'credit' | 'debit') =>
    api.post(`/admin/users/${id}/adjust-balance`, { amount, reason, type }).then((r) => r.data.data),
  impersonateUser: (id: string) => api.post(`/admin/users/${id}/impersonate`).then((r) => r.data.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  assignRole: (userId: string, roleId: string, expiresAt?: string) =>
    api.post(`/admin/users/${userId}/roles`, { roleId, expiresAt }).then((r) => r.data.data),
  unassignRole: (userId: string, roleId: string) =>
    api.delete(`/admin/users/${userId}/roles/${roleId}`).then((r) => r.data),

  // Servers
  listServers: (params: { page?: number; status?: string; regionId?: string; userId?: string; nodeId?: string } = {}) =>
    api.get('/admin/servers', { params }).then((r) => r.data),
  getServer: (id: string) => api.get(`/admin/servers/${id}`).then((r) => r.data.data),
  deleteServer: (id: string) => api.delete(`/admin/servers/${id}`).then((r) => r.data),
  powerServer: (id: string, action: 'start' | 'stop' | 'restart') =>
    api.post(`/admin/servers/${id}/power`, { action }).then((r) => r.data),
  migrateServer: (id: string, targetNodeId: string) =>
    api.post(`/admin/servers/${id}/migrate`, { targetNodeId }).then((r) => r.data),

  // Nodes
  listNodes: () => api.get('/admin/nodes').then((r) => r.data.data),
  getNode: (id: string) => api.get(`/admin/nodes/${id}`).then((r) => r.data.data),
  createNode: (data: any) => api.post('/admin/nodes', data).then((r) => r.data.data),
  updateNode: (id: string, data: any) => api.patch(`/admin/nodes/${id}`, data).then((r) => r.data.data),
  deleteNode: (id: string) => api.delete(`/admin/nodes/${id}`).then((r) => r.data),
  testNode: (id: string) => api.post(`/admin/nodes/${id}/test`).then((r) => r.data.data),
  syncNode: (id: string) => api.post(`/admin/nodes/${id}/sync`).then((r) => r.data.data),
  toggleMaintenance: (id: string, enabled: boolean, note?: string) =>
    api.post(`/admin/nodes/${id}/maintenance`, { enabled, note }).then((r) => r.data.data),
  getNodeVms: (id: string) => api.get(`/admin/nodes/${id}/vms`).then((r) => r.data.data),

  // Billing
  listInvoices: (params: { page?: number; status?: string; userId?: string; from?: string; to?: string } = {}) =>
    api.get('/admin/invoices', { params }).then((r) => r.data),
  getInvoice: (id: string) => api.get(`/admin/invoices/${id}`).then((r) => r.data.data),
  markInvoicePaid: (id: string, paymentId?: string, note?: string) =>
    api.patch(`/admin/invoices/${id}/mark-paid`, { paymentId, note }).then((r) => r.data),
  refundInvoice: (id: string, reason: string) =>
    api.post(`/admin/invoices/${id}/refund`, { reason }).then((r) => r.data),

  // Tickets
  listTickets: (params: { page?: number; status?: string; priority?: string; assignedTo?: string } = {}) =>
    api.get('/admin/tickets', { params }).then((r) => r.data),
  getTicket: (id: string) => api.get(`/admin/tickets/${id}`).then((r) => r.data.data),
  replyTicket: (id: string, content: string, isInternal = false) =>
    api.post(`/admin/tickets/${id}/reply`, { content, isInternal }).then((r) => r.data.data),
  updateTicket: (id: string, data: any) =>
    api.patch(`/admin/tickets/${id}`, data).then((r) => r.data.data),

  // Integrations
  listIntegrations: () => api.get('/admin/integrations').then((r) => r.data.data),
  updateIntegration: (key: string, value: any, isActive?: boolean) =>
    api.patch(`/admin/integrations/${key}`, { value, isActive }).then((r) => r.data.data),
  testProxmox: (data: any) => api.post('/admin/integrations/proxmox/test', data).then((r) => r.data.data),
  testCloudflare: (data: any) => api.post('/admin/integrations/cloudflare/test', data).then((r) => r.data.data),
  testGrafana: (data: any) => api.post('/admin/integrations/grafana/test', data).then((r) => r.data.data),
  testZabbix: (data: any) => api.post('/admin/integrations/zabbix/test', data).then((r) => r.data.data),
  testEmail: (data: any) => api.post('/admin/integrations/email/test', data).then((r) => r.data.data),
  testSms: (data: any) => api.post('/admin/integrations/sms/test', data).then((r) => r.data.data),
  testRazorpay: (data: any) => api.post('/admin/integrations/razorpay/test', data).then((r) => r.data.data),
  testStripe: (data: any) => api.post('/admin/integrations/stripe/test', data).then((r) => r.data.data),

  // Roles
  listRoles: () => api.get('/admin/roles').then((r) => r.data.data),
  createRole: (data: { name: string; displayName: string; description?: string; permissions: string[] }) =>
    api.post('/admin/roles', data).then((r) => r.data.data),
  updateRole: (id: string, data: any) => api.patch(`/admin/roles/${id}`, data).then((r) => r.data.data),
  deleteRole: (id: string) => api.delete(`/admin/roles/${id}`).then((r) => r.data),

  // Announcements
  listAnnouncements: () => api.get('/admin/announcements').then((r) => r.data.data),
  createAnnouncement: (data: any) => api.post('/admin/announcements', data).then((r) => r.data.data),
  updateAnnouncement: (id: string, data: any) =>
    api.patch(`/admin/announcements/${id}`, data).then((r) => r.data.data),
  deleteAnnouncement: (id: string) => api.delete(`/admin/announcements/${id}`).then((r) => r.data),

  // Audit
  auditLogs: (params: { page?: number; userId?: string; action?: string; resource?: string; from?: string; to?: string } = {}) =>
    api.get('/admin/audit-logs', { params }).then((r) => r.data),

  // Settings
  getSettings: () => api.get('/admin/settings').then((r) => r.data.data),
  updateSetting: (key: string, value: any) =>
    api.patch('/admin/settings', { key, value }).then((r) => r.data.data),

  // Templates
  listEmailTemplates: () => api.get('/admin/email-templates').then((r) => r.data.data),
  updateEmailTemplate: (id: string, data: any) =>
    api.patch(`/admin/email-templates/${id}`, data).then((r) => r.data.data),
  testEmailTemplate: (id: string, to: string) =>
    api.post(`/admin/email-templates/${id}/test`, { to }).then((r) => r.data),
  listSmsTemplates: () => api.get('/admin/sms-templates').then((r) => r.data.data),
  updateSmsTemplate: (id: string, data: any) =>
    api.patch(`/admin/sms-templates/${id}`, data).then((r) => r.data.data),
  testSmsTemplate: (id: string, to: string) =>
    api.post(`/admin/sms-templates/${id}/test`, { to }).then((r) => r.data),
}

// Notifications
export const notificationAPI = {
  list: () => api.get('/notifications').then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
}

// Server extras
export const serverExtraAPI = {
  getConsole: (id: string) => api.get(`/servers/${id}/console`).then((r) => r.data.data),
  listSnapshots: (id: string) => api.get(`/servers/${id}/snapshots`).then((r) => r.data.data),
  createSnapshot: (id: string, name: string) =>
    api.post(`/servers/${id}/snapshots`, { name }).then((r) => r.data.data),
  deleteSnapshot: (id: string, snapId: string) =>
    api.delete(`/servers/${id}/snapshots/${snapId}`).then((r) => r.data),
  listFirewall: (id: string) => api.get(`/servers/${id}/firewall`).then((r) => r.data.data),
  createFirewallRule: (id: string, data: any) =>
    api.post(`/servers/${id}/firewall`, data).then((r) => r.data.data),
  deleteFirewallRule: (id: string, ruleId: string) =>
    api.delete(`/servers/${id}/firewall/${ruleId}`).then((r) => r.data),
}

// Payment
export const paymentAPI = {
  createOrder: (invoiceId: string) =>
    api.post('/billing/orders', { invoiceId }).then((r) => r.data.data),
  verifyRazorpay: (data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    invoiceId: string
  }) => api.post('/billing/verify-razorpay', data).then((r) => r.data),
  getTransactions: () => api.get('/billing/transactions').then((r) => r.data.data),
}
