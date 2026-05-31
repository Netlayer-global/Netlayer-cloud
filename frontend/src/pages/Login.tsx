import { useState } from 'react'
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

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const res = await authAPI.login(data.email, data.password)
      login(res.data.data.user, res.data.data.accessToken)
      toast.success('Welcome back')
      const redirect = search.get('redirect') || '/dashboard/home'
      navigate(redirect)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your NetLayer account"
      footer={
        <p className="text-center" style={{ fontSize: 14, color: 'var(--t-med)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 600 }} className="hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs" style={{ color: 'var(--t-med)' }}>Password</label>
            <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--brand)' }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-[9px] cursor-pointer"
              style={{ color: 'var(--t-low)' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <p className="text-center" style={{ fontSize: 12, color: 'var(--t-low)', marginTop: 20 }}>
        By signing in, you agree to our terms and privacy policy.
      </p>
    </AuthLayout>
  )
}
