/**
 * Object Storage service — MinIO/S3 in real mode, in-memory in mock mode.
 *
 * Mock mode (default in dev):
 *   - Bucket operations persist via Prisma `StorageBucket` model.
 *   - Object metadata is tracked in a per-process Map. No real bytes are stored;
 *     the mock-upload endpoint simply accepts the PUT and remembers
 *     name + size + contentType.
 *   - Presigned URLs point back at our own /api/storage/mock-upload/... endpoint,
 *     so the frontend code is identical between mock and real modes.
 *
 * Real mode (MINIO_MOCK_MODE=false + MINIO_ENDPOINT set):
 *   - Uses the `minio` SDK via dynamic import. If the package is not installed
 *     a clear error is surfaced; the install is `npm i minio` in /backend.
 *   - Bucket names are prefixed with MINIO_BUCKET_PREFIX to keep tenant
 *     buckets isolated in shared MinIO clusters.
 */

import crypto from 'crypto'
import logger from '../utils/logger'

export interface StorageObject {
  key: string
  size: number
  lastModified: string
  contentType?: string
  etag?: string
}

interface MinioClientLike {
  bucketExists(name: string): Promise<boolean>
  makeBucket(name: string, region: string): Promise<void>
  removeBucket(name: string): Promise<void>
  listObjectsV2(name: string, prefix?: string, recursive?: boolean): NodeJS.ReadableStream
  removeObject(name: string, key: string): Promise<void>
  presignedPutObject(name: string, key: string, expirySec: number): Promise<string>
  presignedGetObject(name: string, key: string, expirySec: number): Promise<string>
  setBucketPolicy(name: string, policy: string): Promise<void>
  statObject(name: string, key: string): Promise<{ size: number; etag: string; lastModified: Date; metaData?: Record<string, string> }>
}

class ObjectStorageService {
  private mockMode: boolean
  private endpoint: string
  private accessKey: string
  private secretKey: string
  private bucketPrefix: string
  private region: string
  private useSSL: boolean
  private port: number
  private host: string
  private clientPromise: Promise<MinioClientLike | null> | null = null

  // In-mem object tracker for mock mode: Map<physicalBucketName, Map<key, meta>>
  private mockObjects = new Map<string, Map<string, StorageObject>>()
  // Short-lived upload tokens for the mock-upload endpoint
  private mockUploadTokens = new Map<string, { bucket: string; key: string; contentType?: string; expiresAt: number }>()

  constructor() {
    this.mockMode =
      process.env.MINIO_MOCK_MODE === 'true' ||
      !process.env.MINIO_ENDPOINT
    this.endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000'
    this.accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin'
    this.secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin'
    this.bucketPrefix = process.env.MINIO_BUCKET_PREFIX || 'netlayer'
    this.region = process.env.MINIO_REGION || 'us-east-1'

    try {
      const u = new URL(this.endpoint)
      this.host = u.hostname
      this.port = u.port ? parseInt(u.port, 10) : (u.protocol === 'https:' ? 443 : 80)
      this.useSSL = u.protocol === 'https:'
    } catch {
      this.host = 'localhost'
      this.port = 9000
      this.useSSL = false
    }

    if (this.mockMode) {
      logger.debug('ObjectStorage: MOCK MODE')
    }
  }

  isMock() {
    return this.mockMode
  }

  publicEndpoint() {
    return this.endpoint
  }

  bucketPhysicalName(userId: string, displayName: string) {
    const safe = displayName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
    const userSlice = userId.replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase()
    return `${this.bucketPrefix}-${userSlice}-${safe}`
  }

  /**
   * Lazy-load the minio SDK. Returns null if not installed (real mode disabled).
   */
  private async getClient(): Promise<MinioClientLike | null> {
    if (this.mockMode) return null
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        try {
          // Dynamic require keeps the package optional; the literal string is
          // hidden from TS's resolver via Function so the build succeeds even
          // when `minio` is not yet installed (mock mode is the default).
          // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
          const dynamicRequire = new Function('m', 'return require(m)') as (m: string) => any
          let mod: any = null
          try {
            mod = dynamicRequire('minio')
          } catch {
            mod = null
          }
          if (!mod || !mod.Client) {
            logger.warn('minio package not installed — object storage real mode disabled, falling back to mock')
            this.mockMode = true
            return null
          }
          return new mod.Client({
            endPoint: this.host,
            port: this.port,
            useSSL: this.useSSL,
            accessKey: this.accessKey,
            secretKey: this.secretKey,
          }) as MinioClientLike
        } catch (e: any) {
          logger.warn(`Failed to init MinIO client: ${e.message}; falling back to mock`)
          this.mockMode = true
          return null
        }
      })()
    }
    return this.clientPromise
  }

  // ─── Bucket lifecycle ────────────────────────────────────
  async createBucket(physicalName: string): Promise<void> {
    if (this.mockMode) {
      this.mockObjects.set(physicalName, new Map())
      logger.info(`[Storage MOCK] createBucket ${physicalName}`)
      return
    }
    const c = await this.getClient()
    if (!c) {
      this.mockObjects.set(physicalName, new Map())
      return
    }
    const exists = await c.bucketExists(physicalName).catch(() => false)
    if (!exists) {
      await c.makeBucket(physicalName, this.region)
    }
  }

  async deleteBucket(physicalName: string): Promise<void> {
    if (this.mockMode) {
      this.mockObjects.delete(physicalName)
      logger.info(`[Storage MOCK] deleteBucket ${physicalName}`)
      return
    }
    const c = await this.getClient()
    if (!c) {
      this.mockObjects.delete(physicalName)
      return
    }
    // Empty the bucket first (best-effort).
    try {
      const objs = await this.listObjects(physicalName, '')
      for (const o of objs) {
        await c.removeObject(physicalName, o.key).catch(() => {})
      }
    } catch {}
    await c.removeBucket(physicalName).catch(() => {})
  }

  async setBucketPublic(physicalName: string, isPublic: boolean): Promise<void> {
    if (this.mockMode) return
    const c = await this.getClient()
    if (!c) return
    if (!isPublic) {
      // No simple "remove" — set restrictive policy. MinIO will treat empty as default.
      await c.setBucketPolicy(physicalName, '').catch(() => {})
      return
    }
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${physicalName}/*`],
        },
      ],
    })
    await c.setBucketPolicy(physicalName, policy).catch(() => {})
  }

  // ─── Object operations ───────────────────────────────────
  async listObjects(physicalName: string, prefix = ''): Promise<StorageObject[]> {
    if (this.mockMode) {
      const map = this.mockObjects.get(physicalName)
      if (!map) return []
      return Array.from(map.values())
        .filter((o) => o.key.startsWith(prefix))
        .sort((a, b) => a.key.localeCompare(b.key))
    }
    const c = await this.getClient()
    if (!c) return []
    return new Promise<StorageObject[]>((resolve, reject) => {
      const out: StorageObject[] = []
      const stream = c.listObjectsV2(physicalName, prefix, true)
      stream.on('data', (item: any) => {
        if (item.name) {
          out.push({
            key: item.name,
            size: item.size || 0,
            lastModified: (item.lastModified instanceof Date ? item.lastModified : new Date()).toISOString(),
            etag: item.etag,
          })
        }
      })
      stream.on('end', () => resolve(out))
      stream.on('error', (e: any) => reject(e))
    })
  }

  async deleteObject(physicalName: string, key: string): Promise<void> {
    if (this.mockMode) {
      this.mockObjects.get(physicalName)?.delete(key)
      return
    }
    const c = await this.getClient()
    if (!c) return
    await c.removeObject(physicalName, key)
  }

  // ─── Presigned URLs ──────────────────────────────────────
  async presignPut(
    physicalName: string,
    key: string,
    contentType?: string,
    expirySec = 900
  ): Promise<{ url: string; method: 'PUT'; headers: Record<string, string> }> {
    if (this.mockMode) {
      const token = crypto.randomBytes(16).toString('hex')
      this.mockUploadTokens.set(token, {
        bucket: physicalName,
        key,
        contentType,
        expiresAt: Date.now() + expirySec * 1000,
      })
      // Self-relative URL — frontend api client uses /api base.
      return {
        url: `/api/storage/mock-upload/${token}`,
        method: 'PUT',
        headers: contentType ? { 'Content-Type': contentType } : {},
      }
    }
    const c = await this.getClient()
    if (!c) throw new Error('Storage client unavailable')
    const url = await c.presignedPutObject(physicalName, key, expirySec)
    return {
      url,
      method: 'PUT',
      headers: contentType ? { 'Content-Type': contentType } : {},
    }
  }

  async presignGet(physicalName: string, key: string, expirySec = 900): Promise<{ url: string }> {
    if (this.mockMode) {
      const token = crypto.randomBytes(16).toString('hex')
      this.mockUploadTokens.set(token, {
        bucket: physicalName,
        key,
        expiresAt: Date.now() + expirySec * 1000,
      })
      return { url: `/api/storage/mock-download/${token}` }
    }
    const c = await this.getClient()
    if (!c) throw new Error('Storage client unavailable')
    const url = await c.presignedGetObject(physicalName, key, expirySec)
    return { url }
  }

  // ─── Mock upload/download glue used by the route layer ──
  consumeUploadToken(token: string): { bucket: string; key: string; contentType?: string } | null {
    const t = this.mockUploadTokens.get(token)
    if (!t) return null
    if (t.expiresAt < Date.now()) {
      this.mockUploadTokens.delete(token)
      return null
    }
    return { bucket: t.bucket, key: t.key, contentType: t.contentType }
  }

  recordMockObject(physicalName: string, key: string, size: number, contentType?: string) {
    let map = this.mockObjects.get(physicalName)
    if (!map) {
      map = new Map()
      this.mockObjects.set(physicalName, map)
    }
    map.set(key, {
      key,
      size,
      contentType,
      lastModified: new Date().toISOString(),
      etag: `"${crypto.randomBytes(8).toString('hex')}"`,
    })
  }

  getMockObject(physicalName: string, key: string): StorageObject | null {
    return this.mockObjects.get(physicalName)?.get(key) ?? null
  }

  // ─── Aggregate stats for billing/UI ──────────────────────
  async bucketStats(physicalName: string): Promise<{ objects: number; sizeBytes: number }> {
    const list = await this.listObjects(physicalName)
    return {
      objects: list.length,
      sizeBytes: list.reduce((acc, o) => acc + o.size, 0),
    }
  }

  // ─── Per-user access keys (stored in IntegrationConfig) ──
  static accessKeyConfigKey(userId: string) {
    return `storage.user.${userId}`
  }

  generateAccessKeyPair(): { accessKey: string; secretKey: string } {
    const accessKey = `NLAK${crypto.randomBytes(8).toString('hex').toUpperCase()}`
    const secretKey = crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, '').slice(0, 32)
    return { accessKey, secretKey }
  }
}

export default new ObjectStorageService()
