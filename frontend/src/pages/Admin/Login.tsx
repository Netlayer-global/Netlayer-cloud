import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react'
import { authAPI } from '../../api/endpoints'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING']

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

type FormData = z.infer<typeof schema>

export default function AdminLogin() {
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
      const user = res.data.data.user

      if (!ADMIN_ROLES.includes(user.role)) {
        toast.error('This account is not authorized for the admin panel.')
        setSubmitting(false)
        return
      }

      login(user, res.data.data.accessToken)
      toast.success(`Welcome, ${user.firstName}`)
      const redirect = search.get('redirect') || '/admin/dashboard'
      navigate(redirect)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0e0d] flex items-center justify-center p-4 relative">
      {/* Subtle grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#e8e8e6 1px, transparent 1px), linear-gradient(90deg, #e8e8e6 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="w-full max-w-sm relative">
        <Link
          to="/"
          className="absolute -top-12 left-0 flex items-center gap-1.5 text-xs text-[#6a6a68] hover:text-[#e8e8e6] transition-colors cursor-pointer"
        >
          <ArrowLeft size={12} /> Back to NetLayer
        </Link>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-red-950/40 border border-red-900/60 rounded-md flex items-center justify-center">
            <ShieldAlert size={18} className="text-red-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-red-400 font-medium">Admin</div>
            <div className="text-base font-semibold leading-tight">NetLayer</div>
          </div>
        </div>

        <div className="bg-[#161716] border border-[#2a2b2a] rounded-xl p-8">
          <h1 className="text-xl font-medium text-[#e8e8e6] mb-1">Admin sign-in</h1>
          <p className="text-sm text-[#a0a09e] mb-6">Restricted area · Authorized personnel only.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="admin@netlayer.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <label className="block text-xs text-[#a0a09e] mb-1.5">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-[9px] text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={submitting} className="w-full" size="lg">
              Enter admin panel
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#2a2b2a] text-center">
            <p className="text-xs text-[#6a6a68] mb-2">Customer? Use the regular sign-in.</p>
            <Link to="/login" className="text-xs text-[#a0a09e] hover:text-[#e8e8e6] underline">
              Customer sign-in →
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-[#6a6a68]">
          All access is logged · Session expires in 15 minutes
        </div>
      </div>
    </div>
  )
}
