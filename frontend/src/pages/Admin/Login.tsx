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
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--nl-0)', color: 'var(--t-hi)' }}>
      {/* Subtle grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.08,
        }}
      />
      {/* red admin glow */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '50%',
          background: 'radial-gradient(ellipse at 50% 40%, rgba(231,76,60,.12) 0%, transparent 65%)',
          filter: 'blur(70px)',
        }}
      />

      <div className="w-full max-w-sm relative">
        <Link
          to="/"
          className="absolute -top-12 left-0 flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
          style={{ color: 'var(--t-low)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-hi)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-low)')}
        >
          <ArrowLeft size={12} /> Back to NetLayer
        </Link>

        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--c-red-d)', border: '1px solid color-mix(in srgb, var(--c-red) 40%, transparent)' }}>
            <ShieldAlert size={19} style={{ color: 'var(--c-red)' }} />
          </div>
          <div>
            <div className="nl-mono" style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--c-red)', fontWeight: 600 }}>Admin</div>
            <div className="nl-heading" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.1, color: 'var(--t-hi)' }}>NetLayer</div>
          </div>
        </div>

        <div style={{ background: 'var(--nl-2)', border: '1px solid var(--b-default)', borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--shadow-lg)' }}>
          <h1 className="nl-heading" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-hi)', marginBottom: 6 }}>Admin sign-in</h1>
          <p style={{ fontSize: 14, color: 'var(--t-med)', marginBottom: 24 }}>Restricted area · Authorized personnel only.</p>

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
              <label className="block text-xs mb-1.5" style={{ color: 'var(--t-med)' }}>Password</label>
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
                  className="absolute right-2.5 top-[9px] cursor-pointer"
                  style={{ color: 'var(--t-low)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={submitting} className="w-full" size="lg">
              Enter admin panel
            </Button>
          </form>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--b-subtle)' }}>
            <p style={{ fontSize: 12, color: 'var(--t-low)', marginBottom: 8 }}>Customer? Use the regular sign-in.</p>
            <Link to="/login" className="underline" style={{ fontSize: 12, color: 'var(--t-med)' }}>
              Customer sign-in →
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center" style={{ fontSize: 10, color: 'var(--t-low)' }}>
          All access is logged · Session expires in 15 minutes
        </div>
      </div>
    </div>
  )
}
