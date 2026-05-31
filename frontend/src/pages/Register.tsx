import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthLayout } from '../components/Auth/AuthLayout'

const schema = z
  .object({
    firstName: z.string().min(1, 'First name required').max(50),
    lastName: z.string().min(1, 'Last name required').max(50),
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Need an uppercase letter')
      .regex(/\d/, 'Need a digit'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type FormData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('ref')?.toUpperCase() || ''
  const login = useAuthStore((s) => s.login)
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [referralAcknowledged, setReferralAcknowledged] = useState(false)

  useEffect(() => {
    if (referralCode && !referralAcknowledged) {
      setReferralAcknowledged(true)
      toast.success(`Referral code applied: ${referralCode}`, {
        description: 'You and your referrer will both earn ₹250 once you spend ₹100.',
      })
    }
  }, [referralCode, referralAcknowledged])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const res = await authAPI.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        ...(referralCode ? { referralCode } : {}),
      } as any)
      login(res.data.data.user, res.data.data.accessToken)
      toast.success('Account created. Welcome to NetLayer!')
      navigate('/dashboard/home')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start deploying in under a minute"
      footer={
        <p className="text-center" style={{ fontSize: 14, color: 'var(--t-med)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }} className="hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {referralCode && (
        <div
          className="mb-5 px-3 py-2.5 rounded-md text-xs"
          style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)', color: 'var(--brand)' }}
        >
          🎁 Joining with code <span className="font-mono font-semibold">{referralCode}</span> — both of you earn ₹250 once you spend ₹100.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            placeholder="Jane"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            placeholder="Doe"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--t-med)' }}>Password</label>
          <div className="relative">
            <Input
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2.5 top-[9px] cursor-pointer"
              style={{ color: 'var(--t-low)' }}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Input
          label="Confirm password"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Re-enter password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
