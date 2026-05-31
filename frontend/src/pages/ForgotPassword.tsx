import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { authAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthLayout } from '../components/Auth/AuthLayout'

const schema = z.object({ email: z.string().email('Invalid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      await authAPI.forgotPassword(data.email)
      setSent(true)
      toast.success('Check your email')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll send a reset link to your email."
      footer={
        <p className="text-center" style={{ fontSize: 14, color: 'var(--t-med)' }}>
          <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }} className="hover:underline">Back to login</Link>
        </p>
      }
    >
      {sent ? (
        <div
          className="flex items-start gap-3 rounded-md p-4"
          style={{ background: 'var(--c-green-d)', border: '1px solid color-mix(in srgb, var(--c-green) 30%, transparent)' }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--c-green)', marginTop: 1 }} />
          <span style={{ fontSize: 14, color: 'var(--t-hi)' }}>
            If an account exists, a reset link has been sent.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Button type="submit" loading={submitting} className="w-full" size="lg">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
