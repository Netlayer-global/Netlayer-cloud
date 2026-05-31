import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { authAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthLayout } from '../components/Auth/AuthLayout'

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
    <AuthLayout title="Set a new password" subtitle="Choose a strong password.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New password" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm password" type="password" error={errors.confirm?.message} {...register('confirm')} />
        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  )
}
