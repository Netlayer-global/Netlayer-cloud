/**
 * Helpers to (de)serialize JSON-as-string fields used by the SQLite schema.
 * The API responses must keep the same shape the frontend expects.
 */

const safeParse = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback
  if (typeof value !== 'string') return value as T
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const parseJson = safeParse

export const serializeServer = <T extends { specs: any; bandwidth: any; tags?: any }>(s: T) => ({
  ...s,
  specs: safeParse(s.specs, { cpu: 0, ram: 0, disk: 0 }),
  bandwidth: safeParse(s.bandwidth, { used: 0, limit: 1000 }),
  tags: safeParse(s.tags, []),
})

export const serializeInvoice = <T extends { items: any }>(i: T) => ({
  ...i,
  items: safeParse(i.items, []),
})

export const serializeNode = <T extends { ipRanges: any }>(n: T) => ({
  ...n,
  ipRanges: safeParse(n.ipRanges, []),
})

export const serializeRole = <T extends { permissions: any }>(r: T) => ({
  ...r,
  permissions: safeParse(r.permissions, []),
})

export const serializeAnnouncement = <T extends { targetRoles: any }>(a: T) => ({
  ...a,
  targetRoles: safeParse(a.targetRoles, []),
})

export const serializeIntegration = <T extends { value: any }>(c: T) => ({
  ...c,
  value: safeParse(c.value, {}),
})

export const serializeApiKey = <T extends { permissions: any }>(k: T) => ({
  ...k,
  permissions: safeParse(k.permissions, []),
})

export const serializeAudit = <T extends { oldValue?: any; newValue?: any; metadata?: any }>(l: T) => ({
  ...l,
  oldValue: l.oldValue ? safeParse(l.oldValue, null) : null,
  newValue: l.newValue ? safeParse(l.newValue, null) : null,
  metadata: l.metadata ? safeParse(l.metadata, null) : null,
})

export const serializeEmailTemplate = <T extends { variables: any }>(t: T) => ({
  ...t,
  variables: safeParse(t.variables, []),
})

export const serializeSmsTemplate = serializeEmailTemplate
