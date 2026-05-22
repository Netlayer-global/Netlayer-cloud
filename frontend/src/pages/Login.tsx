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
    <div className="min-h-screen bg-[#0d0e0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 cursor-pointer">
          <div className="w-8 h-8 bg-[#e0fe56] rounded-md flex items-center justify-center text-[#0d0e0d] font-bold">
            N
          </div>
          <span className="font-semibold text-base">NetLayer</span>
        </Link>

        <div className="bg-[#161716] border border-[#2a2b2a] rounded-xl p-8">
          <h1 className="text-xl font-medium text-[#e8e8e6] mb-1">Welcome back</h1>
          <p className="text-sm text-[#a0a09e] mb-6">Sign in to your NetLayer account</p>

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
                <label className="text-xs text-[#a0a09e]">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#e0fe56] hover:underline">
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
                  className="absolute right-2.5 top-[9px] text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer"
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

          <p className="text-sm text-[#a0a09e] text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#e0fe56] hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-xs text-[#6a6a68] text-center mt-6">
          By signing in, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  )
}
