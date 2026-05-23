import { useState, useRef, useMemo } from 'react'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Database, Plus, Trash2, Globe, Lock, Upload, Download,
  Folder, File, Copy, Check, Key, ArrowLeft, RefreshCw,
} from 'lucide-react'

import { storageAPI, type StorageBucket, type StorageObjectMeta, type StorageAccessKey } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { cn, formatBytes, formatDate, relativeTime, copyToClipboard } from '../lib/utils'

const bucketSchema = z.object({
  name: z.string()
    .min(3, 'At least 3 characters')
    .max(63, 'At most 63 characters')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'lowercase letters, numbers, and hyphens only'),
  region: z.string().min(1),
  isPublic: z.boolean(),
})
type BucketForm = z.infer<typeof bucketSchema>

const REGIONS = [
  { value: 'us-east-1', label: 'US East (Virginia)' },
  { value: 'us-west-1', label: 'US West (San Francisco)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-south-1', label: 'India (Mumbai)' },
  { value: 'ap-southeast-1', label: 'Singapore' },
]

export default function ObjectStorage() {
  const [tab, setTab] = useState<'buckets' | 'access-keys'>('buckets')
  const [openBucket, setOpenBucket] = useState<StorageBucket | null>(null)

  if (openBucket) {
    return <BucketDetail bucket={openBucket} onBack={() => setOpenBucket(null)} />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Object Storage</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          S3-compatible buckets for static assets, backups, and media.
        </p>
      </div>

      <div className="border-b border-[#2a2b2a] flex gap-1">
        {(['buckets', 'access-keys'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 h-9 text-sm cursor-pointer transition-colors -mb-px border-b-2',
              tab === t
                ? 'text-[#e8e8e6] border-[#e0fe56]'
                : 'text-[#a0a09e] border-transparent hover:text-[#e8e8e6]'
            )}
          >
            {t === 'buckets' ? 'Buckets' : 'Access Keys'}
          </button>
        ))}
      </div>

      {tab === 'buckets' ? (
        <BucketsList onOpen={setOpenBucket} />
      ) : (
        <AccessKeysPanel />
      )}
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Buckets list + create
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BucketsList({ onOpen }: { onOpen: (b: StorageBucket) => void }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: buckets = [], isLoading } = useQuery({
    queryKey: ['storage', 'buckets'],
    queryFn: () => storageAPI.listBuckets().then((r) => r.data.data),
  })

  const form = useForm<BucketForm>({
    resolver: zodResolver(bucketSchema),
    defaultValues: { name: '', region: 'us-east-1', isPublic: false },
  })

  const createBucket = useMutation({
    mutationFn: (v: BucketForm) => storageAPI.createBucket(v.name, v.region, v.isPublic),
    onSuccess: () => {
      toast.success('Bucket created')
      qc.invalidateQueries({ queryKey: ['storage', 'buckets'] })
      setOpen(false)
      form.reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create bucket'),
  })

  const deleteBucket = useMutation({
    mutationFn: (id: string) => storageAPI.deleteBucket(id),
    onSuccess: () => {
      toast.success('Bucket deleted')
      qc.invalidateQueries({ queryKey: ['storage', 'buckets'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6a6a68]">
          {buckets.length} {buckets.length === 1 ? 'bucket' : 'buckets'}
        </p>
        <Button onClick={() => setOpen(true)}>
          <Plus size={14} /> Create bucket
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : buckets.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <Database size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No buckets yet</h3>
          <p className="text-sm text-[#a0a09e] mb-4">
            Create your first bucket to start uploading files.
          </p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={13} /> Create bucket
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map((b) => (
            <Card
              key={b.id}
              hover
              className="flex flex-col gap-3"
              onClick={() => onOpen(b)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Database size={16} className="text-[#e0fe56] shrink-0" />
                  <span className="text-[#e8e8e6] font-medium text-sm truncate">{b.name}</span>
                </div>
                {b.isPublic ? (
                  <Badge variant="building">
                    <Globe size={10} /> Public
                  </Badge>
                ) : (
                  <Badge variant="default">
                    <Lock size={10} /> Private
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <div className="text-[#6a6a68]">Objects</div>
                  <div className="text-[#e8e8e6]">{b.objects}</div>
                </div>
                <div>
                  <div className="text-[#6a6a68]">Size</div>
                  <div className="text-[#e8e8e6]">{formatBytes(b.sizeBytes)}</div>
                </div>
                <div>
                  <div className="text-[#6a6a68]">Region</div>
                  <div className="text-[#e8e8e6]">{b.region}</div>
                </div>
                <div>
                  <div className="text-[#6a6a68]">Created</div>
                  <div className="text-[#e8e8e6]">{relativeTime(b.createdAt)}</div>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-[#2a2b2a]">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete bucket "${b.name}"? This will remove all objects.`)) {
                      deleteBucket.mutate(b.id)
                    }
                  }}
                  className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                  title="Delete bucket"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); form.reset() }}
        title="Create bucket"
        description="Bucket names are globally unique and can't be changed after creation."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setOpen(false); form.reset() }}>Cancel</Button>
            <Button loading={createBucket.isPending} onClick={form.handleSubmit((v) => createBucket.mutate(v))}>
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={form.handleSubmit((v) => createBucket.mutate(v))} className="space-y-4">
          <Input
            label="Bucket name"
            placeholder="my-app-assets"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <div>
            <label className="block text-xs text-[#a0a09e] mb-1.5">Region</label>
            <select
              className="w-full bg-[#1e1f1e] border border-[#333433] text-[#e8e8e6] rounded-md h-9 px-3 text-sm focus:border-[#e0fe56] focus:outline-none transition-colors"
              {...form.register('region')}
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-2 cursor-pointer p-3 rounded-md bg-[#1e1f1e] border border-[#2a2b2a]">
            <input
              type="checkbox"
              className="mt-1 accent-[#e0fe56] cursor-pointer"
              {...form.register('isPublic')}
            />
            <div>
              <div className="text-sm text-[#e8e8e6]">Public access</div>
              <div className="text-xs text-[#6a6a68]">
                Anyone on the internet will be able to GET objects in this bucket. Use only for static assets.
              </div>
            </div>
          </label>
        </form>
      </Modal>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Bucket detail â€” file browser, upload, settings
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BucketDetail({ bucket, onBack }: { bucket: StorageBucket; onBack: () => void }) {
  const qc = useQueryClient()
  const [prefix, setPrefix] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [uploading, setUploading] = useState<{ name: string; pct: number }[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { data: liveBucket } = useQuery({
    queryKey: ['storage', 'bucket', bucket.id],
    queryFn: () => storageAPI.getBucket(bucket.id).then((r) => r.data.data),
    refetchInterval: 10_000,
    initialData: bucket as any,
  })

  const { data: objects = [], isLoading, refetch } = useQuery({
    queryKey: ['storage', 'objects', bucket.id, prefix],
    queryFn: () => storageAPI.listObjects(bucket.id, prefix).then((r) => r.data.data),
  })

  // Group objects by virtual folders (prefix split on /)
  const { folders, files } = useMemo(() => {
    const folderSet = new Set<string>()
    const fileList: StorageObjectMeta[] = []
    const cleanPrefix = prefix
    for (const o of objects) {
      const rel = o.key.startsWith(cleanPrefix) ? o.key.slice(cleanPrefix.length) : o.key
      const slash = rel.indexOf('/')
      if (slash >= 0) {
        folderSet.add(rel.slice(0, slash))
      } else {
        fileList.push(o)
      }
    }
    return { folders: Array.from(folderSet).sort(), files: fileList }
  }, [objects, prefix])

  const deleteObject = useMutation({
    mutationFn: (key: string) => storageAPI.deleteObject(bucket.id, key),
    onSuccess: () => {
      toast.success('Object deleted')
      qc.invalidateQueries({ queryKey: ['storage', 'objects', bucket.id] })
      qc.invalidateQueries({ queryKey: ['storage', 'bucket', bucket.id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateBucket = useMutation({
    mutationFn: (isPublic: boolean) => storageAPI.updateBucket(bucket.id, { isPublic }),
    onSuccess: () => {
      toast.success('Bucket updated')
      qc.invalidateQueries({ queryKey: ['storage', 'bucket', bucket.id] })
      qc.invalidateQueries({ queryKey: ['storage', 'buckets'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    setUploading(files.map((f) => ({ name: f.name, pct: 0 })))

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const key = prefix + file.name
      try {
        const presigned = await storageAPI.presignPut(bucket.id, key, file.type)
        const { url, headers } = presigned.data.data
        await axios.request({
          method: 'PUT',
          url,
          data: file,
          headers,
          onUploadProgress: (evt) => {
            const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0
            setUploading((prev) =>
              prev.map((u, idx) => (idx === i ? { ...u, pct } : u))
            )
          },
        })
      } catch (e: any) {
        toast.error(`${file.name}: ${e.response?.data?.error || e.message}`)
      }
    }

    setUploading([])
    toast.success(`${files.length} ${files.length === 1 ? 'file' : 'files'} uploaded`)
    qc.invalidateQueries({ queryKey: ['storage', 'objects', bucket.id] })
    qc.invalidateQueries({ queryKey: ['storage', 'bucket', bucket.id] })
    qc.invalidateQueries({ queryKey: ['storage', 'buckets'] })
  }

  const handleDownload = async (key: string) => {
    try {
      const r = await storageAPI.presignGet(bucket.id, key)
      const url = r.data.data.url.startsWith('http')
        ? r.data.data.url
        : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${r.data.data.url}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to generate download link')
    }
  }

  const breadcrumbs = useMemo(() => {
    if (!prefix) return []
    return prefix.replace(/\/$/, '').split('/').map((seg, idx, arr) => ({
      name: seg,
      path: arr.slice(0, idx + 1).join('/') + '/',
    }))
  }, [prefix])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
          title="Back to buckets"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-medium text-[#e8e8e6] truncate">{bucket.name}</h1>
            {liveBucket?.isPublic ? (
              <Badge variant="building"><Globe size={10} /> Public</Badge>
            ) : (
              <Badge variant="default"><Lock size={10} /> Private</Badge>
            )}
          </div>
          <p className="text-xs text-[#6a6a68] mt-0.5">
            {bucket.region} Â· {liveBucket?.objects ?? bucket.objects} objects Â· {formatBytes(liveBucket?.sizeBytes ?? bucket.sizeBytes)}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(true)}>
          Settings
        </Button>
        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload size={13} /> Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Breadcrumb path */}
      <div className="flex items-center gap-1 text-xs flex-wrap">
        <button
          onClick={() => setPrefix('')}
          className={cn(
            'px-2 h-6 rounded cursor-pointer transition-colors',
            !prefix ? 'bg-[#1e1f1e] text-[#e8e8e6]' : 'text-[#a0a09e] hover:bg-[#1e1f1e]'
          )}
        >
          /
        </button>
        {breadcrumbs.map((b, idx) => (
          <div key={b.path} className="flex items-center gap-1">
            <span className="text-[#6a6a68]">/</span>
            <button
              onClick={() => setPrefix(b.path)}
              className={cn(
                'px-2 h-6 rounded cursor-pointer transition-colors',
                idx === breadcrumbs.length - 1
                  ? 'bg-[#1e1f1e] text-[#e8e8e6]'
                  : 'text-[#a0a09e] hover:bg-[#1e1f1e]'
              )}
            >
              {b.name}
            </button>
          </div>
        ))}
        <button
          onClick={() => refetch()}
          className="ml-auto text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Upload progress */}
      {uploading.length > 0 && (
        <Card>
          <div className="text-xs text-[#a0a09e] mb-2">Uploading {uploading.length} {uploading.length === 1 ? 'file' : 'files'}â€¦</div>
          <div className="space-y-2">
            {uploading.map((u) => (
              <div key={u.name}>
                <div className="flex justify-between text-xs">
                  <span className="text-[#e8e8e6] truncate">{u.name}</span>
                  <span className="text-[#6a6a68]">{u.pct}%</span>
                </div>
                <div className="h-1 bg-[#252625] rounded mt-1 overflow-hidden">
                  <div className="h-full bg-[#e0fe56] transition-all" style={{ width: `${u.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Object list */}
      {isLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : folders.length === 0 && files.length === 0 ? (
        <EmptyTable message="This folder is empty. Drag files here or use the Upload button." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH className="hidden sm:table-cell">Size</TH>
              <TH className="hidden md:table-cell">Modified</TH>
              <TH className="w-24"></TH>
            </tr>
          </THead>
          <TBody>
            {folders.map((f) => (
              <TR key={`d-${f}`} className="cursor-pointer" onClick={() => setPrefix(prefix + f + '/')}>
                <TD className="text-[#e8e8e6] font-medium">
                  <div className="flex items-center gap-2">
                    <Folder size={14} className="text-[#e0fe56]" />
                    {f}
                  </div>
                </TD>
                <TD className="hidden sm:table-cell">â€”</TD>
                <TD className="hidden md:table-cell">â€”</TD>
                <TD></TD>
              </TR>
            ))}
            {files.map((o) => {
              const displayName = o.key.startsWith(prefix) ? o.key.slice(prefix.length) : o.key
              return (
                <TR key={`f-${o.key}`}>
                  <TD className="text-[#e8e8e6]">
                    <div className="flex items-center gap-2 min-w-0">
                      <File size={14} className="text-[#a0a09e] shrink-0" />
                      <span className="truncate">{displayName}</span>
                    </div>
                  </TD>
                  <TD className="hidden sm:table-cell text-xs">{formatBytes(o.size)}</TD>
                  <TD className="hidden md:table-cell text-xs">{formatDate(o.lastModified)}</TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownload(o.key)}
                        className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${displayName}"?`)) deleteObject.mutate(o.key)
                        }}
                        className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      )}

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Bucket settings"
        size="lg"
        footer={<Button variant="secondary" onClick={() => setSettingsOpen(false)}>Close</Button>}
      >
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[#6a6a68] mb-1">Bucket name</div>
            <div className="text-sm text-[#e8e8e6] font-mono">{bucket.name}</div>
          </div>
          <div>
            <div className="text-xs text-[#6a6a68] mb-1">Region</div>
            <div className="text-sm text-[#e8e8e6]">{bucket.region}</div>
          </div>
          {bucket.endpoint && (
            <div>
              <div className="text-xs text-[#6a6a68] mb-1">Endpoint</div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[#e8e8e6] bg-[#0d0e0d] px-2 py-1 rounded flex-1 truncate">{bucket.endpoint}</code>
                <button
                  onClick={async () => {
                    if (await copyToClipboard(bucket.endpoint!)) toast.success('Copied')
                  }}
                  className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          )}
          <div className="border-t border-[#2a2b2a] pt-4">
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-md bg-[#1e1f1e] border border-[#2a2b2a]">
              <input
                type="checkbox"
                className="mt-1 accent-[#e0fe56] cursor-pointer"
                checked={!!liveBucket?.isPublic}
                onChange={(e) => updateBucket.mutate(e.target.checked)}
                disabled={updateBucket.isPending}
              />
              <div>
                <div className="text-sm text-[#e8e8e6]">Public access</div>
                <div className="text-xs text-[#6a6a68]">
                  Anyone on the internet can GET objects in this bucket.
                </div>
              </div>
            </label>
          </div>
          <div>
            <div className="text-xs text-[#6a6a68] mb-1">Created</div>
            <div className="text-sm text-[#e8e8e6]">{formatDate(bucket.createdAt)}</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Access Keys
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AccessKeysPanel() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [revealed, setRevealed] = useState<{ accessKey: string; secretKey: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['storage', 'access-keys'],
    queryFn: () => storageAPI.listAccessKeys().then((r) => r.data.data),
  })

  const create = useMutation({
    mutationFn: () => storageAPI.createAccessKey(name),
    onSuccess: (r) => {
      toast.success('Access key created')
      setRevealed({ accessKey: r.data.data.accessKey, secretKey: r.data.data.secretKey! })
      setOpen(false)
      setName('')
      qc.invalidateQueries({ queryKey: ['storage', 'access-keys'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => storageAPI.deleteAccessKey(id),
    onSuccess: () => {
      toast.success('Access key revoked')
      qc.invalidateQueries({ queryKey: ['storage', 'access-keys'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const handleCopy = async (text: string, label: string) => {
    if (await copyToClipboard(text)) {
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6a6a68]">
          Access keys let you connect S3-compatible tools (aws-cli, rclone, mc) to your buckets.
        </p>
        <Button onClick={() => setOpen(true)}>
          <Plus size={14} /> New access key
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-lg" />
      ) : keys.length === 0 ? (
        <Card padding="p-10" className="text-center">
          <Key size={28} className="text-[#6a6a68] mx-auto mb-3" />
          <h3 className="font-medium text-[#e8e8e6] mb-1">No access keys</h3>
          <p className="text-sm text-[#a0a09e] mb-4">
            Create an access key to use object storage from your CLI or apps.
          </p>
        </Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Access Key</TH>
              <TH className="hidden md:table-cell">Created</TH>
              <TH className="w-12"></TH>
            </tr>
          </THead>
          <TBody>
            {keys.map((k: StorageAccessKey) => (
              <TR key={k.id}>
                <TD className="text-[#e8e8e6] font-medium">{k.name}</TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono">{k.accessKey}</code>
                    <button
                      onClick={() => handleCopy(k.accessKey, k.id)}
                      className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded transition-colors"
                    >
                      {copied === k.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </TD>
                <TD className="hidden md:table-cell text-xs">{formatDate(k.createdAt)}</TD>
                <TD className="text-right">
                  <button
                    onClick={() => {
                      if (confirm(`Revoke access key "${k.name}"? Any tools using this key will stop working.`)) {
                        del.mutate(k.id)
                      }
                    }}
                    className="text-[#6a6a68] hover:text-red-400 cursor-pointer p-1 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {/* Create modal */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); setName('') }}
        title="Create access key"
        description="The secret will be shown only once. Copy it now â€” we don't store it in plain text."
        footer={
          <>
            <Button variant="secondary" onClick={() => { setOpen(false); setName('') }}>Cancel</Button>
            <Button
              loading={create.isPending}
              disabled={!name.trim()}
              onClick={() => create.mutate()}
            >
              Create
            </Button>
          </>
        }
      >
        <Input
          label="Key name"
          placeholder="My laptop"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Modal>

      {/* Revealed secret modal */}
      <Modal
        open={!!revealed}
        onClose={() => setRevealed(null)}
        title="Save your secret access key"
        description="This is the only time you'll see this secret. Copy it to a safe place now."
        size="lg"
        footer={
          <Button onClick={() => setRevealed(null)}>I have saved it</Button>
        }
      >
        {revealed && (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-[#6a6a68] mb-1">Access Key</div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[#e8e8e6] bg-[#0d0e0d] px-2 py-2 rounded flex-1 font-mono break-all">
                  {revealed.accessKey}
                </code>
                <button
                  onClick={() => handleCopy(revealed.accessKey, 'access')}
                  className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer p-2 rounded transition-colors"
                >
                  {copied === 'access' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6a6a68] mb-1">Secret Key</div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[#e8e8e6] bg-[#0d0e0d] px-2 py-2 rounded flex-1 font-mono break-all">
                  {revealed.secretKey}
                </code>
                <button
                  onClick={() => handleCopy(revealed.secretKey, 'secret')}
                  className="text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer p-2 rounded transition-colors"
                >
                  {copied === 'secret' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-900/40 rounded-md p-3 mt-4">
              Treat the secret key like a password. If it leaks, revoke this key immediately and create a new one.
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

