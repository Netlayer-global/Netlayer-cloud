import prisma from './prisma'
import logger from './logger'

const cache = new Map<string, { value: any; ts: number }>()
const TTL = 30_000 // 30s cache

export async function getConfig<T = any>(key: string, fallback: T): Promise<T> {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < TTL) return cached.value as T

  try {
    const row = await prisma.integrationConfig.findUnique({ where: { key } })
    if (!row) {
      cache.set(key, { value: fallback, ts: Date.now() })
      return fallback
    }
    let parsed: any
    try {
      parsed = JSON.parse(row.value)
    } catch {
      parsed = fallback
    }
    cache.set(key, { value: parsed, ts: Date.now() })
    return parsed as T
  } catch (e: any) {
    logger.warn(`getConfig(${key}) failed`, { error: e.message })
    return fallback
  }
}

export function clearConfigCache() {
  cache.clear()
}
