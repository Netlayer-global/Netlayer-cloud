/**
 * HashiCorp Vault client (optional).
 *
 * When VAULT_ADDR + VAULT_TOKEN are set, secret lookups go through Vault.
 * Otherwise we fall back to process.env. The intent is that production rolls
 * Vault in, dev keeps using .env files, and existing code keeps working
 * without changes.
 *
 * Usage at API boot:
 *
 *   import { getSecret } from './utils/vault'
 *   const jwtSecret = await getSecret('jwt/access') ?? process.env.JWT_SECRET
 *
 * Policy + path conventions live in infra/security/vault/policies/.
 */

import logger from './logger'

interface KVResult {
  data?: { data?: Record<string, string> }
}

const VAULT_ADDR = process.env.VAULT_ADDR
const VAULT_TOKEN = process.env.VAULT_TOKEN
const VAULT_NAMESPACE = process.env.VAULT_NAMESPACE
const VAULT_KV_MOUNT = process.env.VAULT_KV_MOUNT || 'kv'

// In-memory cache to avoid hammering Vault for every secret lookup. Vault
// itself supports TTL-based renewal but the API only fetches at boot so a
// 60-second cache is fine and dramatically simpler.
const cache = new Map<string, { value: string; fetchedAt: number }>()
const CACHE_TTL_MS = 60_000

export function vaultEnabled(): boolean {
  return !!(VAULT_ADDR && VAULT_TOKEN)
}

/**
 * Read a secret from Vault. Returns null when Vault isn't configured
 * or the key isn't found — callers should fall back to env.
 *
 * `path` is relative to the kv mount, e.g. "netlayer/jwt".
 * `key` is the field inside the kv document, e.g. "access_secret".
 */
export async function getSecret(path: string, key: string): Promise<string | null> {
  if (!vaultEnabled()) return null

  const cacheKey = `${path}::${key}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value
  }

  try {
    const url = `${VAULT_ADDR}/v1/${VAULT_KV_MOUNT}/data/${path}`
    const headers: Record<string, string> = {
      'X-Vault-Token': VAULT_TOKEN!,
    }
    if (VAULT_NAMESPACE) headers['X-Vault-Namespace'] = VAULT_NAMESPACE

    const res = await fetch(url, { headers })
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`Vault returned ${res.status}: ${await res.text()}`)
    }
    const body = (await res.json()) as KVResult
    const value = body.data?.data?.[key]
    if (value) cache.set(cacheKey, { value, fetchedAt: Date.now() })
    return value ?? null
  } catch (err: any) {
    logger.warn({ err: err.message, path, key }, 'Vault secret lookup failed')
    return null
  }
}

/**
 * Convenience: try Vault first, fall back to a process.env value.
 */
export async function secretOrEnv(
  vaultPath: string,
  vaultKey: string,
  envKey: string
): Promise<string | undefined> {
  const v = await getSecret(vaultPath, vaultKey)
  return v ?? process.env[envKey]
}
