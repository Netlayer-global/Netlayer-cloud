import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { kycAPI } from '../api/endpoints'
import { cn } from '../lib/utils'

/**
 * Round 24 — KYC submission page (India).
 *
 * Three-file upload: PAN, Aadhaar, address proof. PAN number is captured
 * separately for OCR cross-verification. After submit the user enters
 * a holding state until an admin reviews.
 */
export default function Kyc() {
  const qc = useQueryClient()
  const [panNumber, setPanNumber] = useState('')
  const [files, setFiles] = useState<{ pan?: File; aadhaar?: File; address?: File }>({})
  const [progress, setProgress] = useState(0)

  const status = useQuery({
    queryKey: ['kyc', 'status'],
    queryFn: () => kycAPI.status().then((r: any) => r.data.data),
  })

  const submit = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('panNumber', panNumber)
      fd.append('pan', files.pan!)
      fd.append('aadhaar', files.aadhaar!)
      fd.append('address', files.address!)
      return kycAPI.submit(fd, setProgress)
    },
    onSuccess: () => {
      toast.success('KYC submitted — admin review usually takes 1-2 business days')
      qc.invalidateQueries({ queryKey: ['kyc', 'status'] })
      setProgress(0)
      setFiles({})
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || 'Submission failed')
      setProgress(0)
    },
  })

  if (status.isLoading) return <div className="text-sm text-[#a0a09e]">Loading…</div>

  const s = status.data?.kycStatus

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <ShieldCheck className="mb-3 text-[#e0fe56]" size={28} />
        <h1 className="text-2xl font-medium text-[#e8e8e6]">KYC verification</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Required for Indian compliance and to lift transaction limits. Your documents are encrypted at rest and only viewed by our verified compliance team.
        </p>
      </div>

      {/* Status banner */}
      {s === 'approved' && (
        <Card className="border-[#4ade80] bg-green-950/20">
          <CheckCircle2 size={20} className="text-[#4ade80]" />
          <div>
            <div className="text-sm font-medium text-[#e8e8e6]">KYC approved</div>
            <div className="text-xs text-[#a0a09e]">Approved on {new Date(status.data.kycReviewedAt!).toLocaleDateString()}</div>
          </div>
        </Card>
      )}
      {s === 'pending' && (
        <Card className="border-amber-700 bg-amber-950/20">
          <AlertCircle size={20} className="text-amber-400" />
          <div>
            <div className="text-sm font-medium text-[#e8e8e6]">Under review</div>
            <div className="text-xs text-[#a0a09e]">
              Submitted {new Date(status.data.kycSubmittedAt!).toLocaleDateString()}. We'll email you once reviewed.
            </div>
          </div>
        </Card>
      )}
      {s === 'rejected' && (
        <Card className="border-red-700 bg-red-950/20">
          <AlertCircle size={20} className="text-red-400" />
          <div>
            <div className="text-sm font-medium text-[#e8e8e6]">Re-submission required</div>
            <div className="text-xs text-[#a0a09e]">
              Reason: {status.data.kycRejectReason}
            </div>
          </div>
        </Card>
      )}

      {(s === 'none' || s === 'rejected') && (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5 mt-4 space-y-4">
          <Input
            label="PAN number"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
            placeholder="ABCDE1234F"
            className="font-mono"
            maxLength={10}
          />

          <FilePicker
            label="PAN card (front, JPG/PNG/PDF)"
            value={files.pan}
            onChange={(f) => setFiles({ ...files, pan: f })}
          />
          <FilePicker
            label="Aadhaar (mask first 8 digits before uploading)"
            value={files.aadhaar}
            onChange={(f) => setFiles({ ...files, aadhaar: f })}
          />
          <FilePicker
            label="Address proof (electricity bill, bank statement, etc.)"
            value={files.address}
            onChange={(f) => setFiles({ ...files, address: f })}
          />

          {submit.isPending && (
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#a0a09e] mb-1">
                <span>Uploading…</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-1 rounded-full bg-[#252625] overflow-hidden">
                <div className="h-full bg-[#e0fe56] transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => submit.mutate()}
            loading={submit.isPending}
            disabled={
              !/^[A-Z]{5}\d{4}[A-Z]$/.test(panNumber) ||
              !files.pan || !files.aadhaar || !files.address
            }
          >
            <Upload size={14} className="mr-1.5" /> Submit for review
          </Button>
        </div>
      )}
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border p-4 flex items-start gap-3', className)}>
      {children}
    </div>
  )
}

function FilePicker({
  label, value, onChange,
}: { label: string; value?: File; onChange: (f: File | undefined) => void }) {
  const id = `file-${label.replace(/\s/g, '-')}`
  return (
    <div>
      <label className="block text-xs text-[#a0a09e] mb-1.5">{label}</label>
      <div className="border border-dashed border-[#333433] rounded-md p-3 hover:border-[#e0fe56]/40 transition-colors">
        <input
          id={id}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0])}
        />
        <label htmlFor={id} className="cursor-pointer flex items-center gap-3">
          <Upload size={16} className={value ? 'text-[#e0fe56]' : 'text-[#6a6a68]'} />
          <div className="flex-1 min-w-0">
            {value ? (
              <>
                <div className="text-xs text-[#e8e8e6] truncate">{value.name}</div>
                <div className="text-[10px] text-[#a0a09e]">{(value.size / 1024 ** 2).toFixed(2)} MB · click to replace</div>
              </>
            ) : (
              <div className="text-xs text-[#a0a09e]">Click to upload (max 5 MB, JPG/PNG/PDF)</div>
            )}
          </div>
        </label>
      </div>
    </div>
  )
}
