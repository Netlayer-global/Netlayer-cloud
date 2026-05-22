import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { authAPI } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

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
    <div className="min-h-screen bg-[#0d0e0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#e0fe56] rounded-md flex items-center justify-center text-[#0d0e0d] font-bold">N</div>
          <span className="font-semibold text-base">NetLayer</span>
        </Link>
        <div className="bg-[#161716] border border-[#2a2b2a] rounded-xl p-8">
          <h1 className="text-xl font-medium mb-1">Reset password</h1>
          <p className="text-sm text-[#a0a09e] mb-6">
            We'll send a reset link to your email.
          </p>
          {sent ? (
            <div className="bg-green-950/30 border border-green-900/60 text-green-400 rounded-md p-3 text-sm">
              If an account exists, a reset link has been sent.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              <Button type="submit" loading={submitting} className="w-full" size="lg">
                Send reset link
              </Button>
            </form>
          )}
          <p className="text-sm text-[#a0a09e] text-center mt-6">
            <Link to="/login" className="text-[#e0fe56] hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
