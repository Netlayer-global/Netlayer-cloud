import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { authAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Need uppercase')
      .regex(/\d/, 'Need digit'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const token = search.get('token') || ''
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Invalid reset link')
      return
    }
    setSubmitting(true)
    try {
      await authAPI.resetPassword(token, data.newPassword)
      toast.success('Password reset. Please sign in.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Reset failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0e0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#e0fe56] rounded-md flex items-center justify-center text-[#0d0e0d] font-bold">N</div>
          <span className="font-semibold text-base">NetLayer</span>
        </Link>
        <div className="bg-[#161716] border border-[#2a2b2a] rounded-xl p-8">
          <h1 className="text-xl font-medium mb-1">Set a new password</h1>
          <p className="text-sm text-[#a0a09e] mb-6">Choose a strong password.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="New password" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
            <Input label="Confirm password" type="password" error={errors.confirm?.message} {...register('confirm')} />
            <Button type="submit" loading={submitting} className="w-full" size="lg">
              Reset password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
