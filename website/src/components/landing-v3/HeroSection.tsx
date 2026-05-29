import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Github, Mail } from 'lucide-react'

/**
 * Hero — split layout.
 *
 * Left column: large light-weight headline, supporting copy, CTA pair, plus
 * a row of trust pills. Right column: a "Deploy in seconds" signup card —
 * mirrors the in-product flow but lives on the public site so a visitor
 * can complete signup without bouncing off to the dashboard origin.
 *
 * Background:
 *   - Animated WebGL2 noise + lime tint (~1 KB GLSL)
 *   - Dot grid texture overlay
 *   - Soft top-down gradient for contrast under the copy
 *
 * Submitting the signup form posts to `${VITE_DASHBOARD_URL}/register` so
 * the dashboard owns the auth cookie. Failure cases just push the user
 * to the dashboard register page with the email pre-filled.
 */

const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;

float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 st = (uv - 0.5) * 2.0;
  st.x *= resolution.x / resolution.y;
  float t = time * 0.20;
  vec2 p = st * 1.6;
  float n = noise(p + t) * 0.55
          + noise(p * 2.0 - t * 0.5) * 0.30
          + noise(p * 4.0 + t * 0.3) * 0.15;

  vec3 deep   = vec3(0.031, 0.035, 0.031);
  vec3 mid    = vec3(0.060, 0.065, 0.060);
  vec3 brand  = vec3(0.784, 0.945, 0.207);    // matches --brand #c8f135

  vec3 col = mix(deep, mid, n);
  col += brand * n * 0.035;

  // top-right glow so the signup card sits in light
  vec2 g = uv - vec2(0.78, 0.45);
  g.x *= resolution.x / resolution.y;
  float glow = 1.0 - smoothstep(0.0, 0.55, length(g));
  col += brand * glow * 0.08;

  // vignette
  col *= clamp(1.0 - length(uv - 0.5) * 0.55, 0.55, 1.0);
  O = vec4(col, 1.0);
}`

const VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float; in vec4 position;
void main() { gl_Position = position; }`

function ShaderBackground() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null
    if (!gl) return

    const vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, VERTEX_SHADER); gl.compileShader(vs)
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, FRAGMENT_SHADER); gl.compileShader(fs)

    const program = gl.createProgram()!
    gl.attachShader(program, vs); gl.attachShader(program, fs)
    gl.linkProgram(program); gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW)
    const positionLoc = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    const resUniform = gl.getUniformLocation(program, 'resolution')
    const timeUniform = gl.getUniformLocation(program, 'time')

    const dpr = Math.max(1, Math.min(window.devicePixelRatio, 2))
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize(); window.addEventListener('resize', resize)

    let raf = 0
    const start = performance.now()
    const loop = () => {
      gl.uniform2f(resUniform, canvas.width, canvas.height)
      gl.uniform1f(timeUniform, (performance.now() - start) * 0.001)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
      gl.deleteProgram(program); gl.deleteShader(vs); gl.deleteShader(fs); gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full block"
      style={{ background: '#0d0e0d' }}
      aria-hidden="true"
    />
  )
}

function SignupCard() {
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(true)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !agreed) return
    const url = `${DASHBOARD_URL}/register?email=${encodeURIComponent(email)}`
    window.location.assign(url)
  }

  return (
    <motion.div
      className="rounded-lg p-6 lg:p-8"
      style={{
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,241,53,0.15)',
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="text-2xl text-[#0d0e0d]" style={{ fontWeight: 500, letterSpacing: '-0.01em' }}>
        Deploy in seconds
      </h2>
      <p className="mt-1.5 text-[13px] text-[#525666]">
        Free ₹3,500 credit · No card required
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <Field
          label="Work email"
          type="email"
          required
          value={email}
          onChange={(v) => setEmail(v)}
          placeholder="you@company.com"
        />

        <label className="flex items-start gap-2.5 text-[13px] text-[#525666] mt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 cursor-pointer"
            style={{ accentColor: 'var(--brand)' }}
          />
          <span>
            I agree to the{' '}
            <Link to="/legal/terms" className="underline" style={{ color: '#0d0e0d' }}>Terms of Service</Link>{' '}
            and the{' '}
            <Link to="/legal/privacy" className="underline" style={{ color: '#0d0e0d' }}>Privacy Policy</Link>.
          </span>
        </label>

        <button
          type="submit"
          disabled={!email || !agreed}
          className="w-full h-11 rounded-md text-[14px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--brand)', color: '#0d0e0d' }}
        >
          Create free account
        </button>

        <div className="flex items-center gap-3 my-3">
          <span className="flex-1 h-px bg-[#e1e3e8]" />
          <span className="text-[10.5px] uppercase tracking-[.18em] text-[#a1a5b2]">or</span>
          <span className="flex-1 h-px bg-[#e1e3e8]" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <SocialButton href={`${DASHBOARD_URL}/register?provider=github`} icon={<Github size={14} />}>
            GitHub
          </SocialButton>
          <SocialButton href={`${DASHBOARD_URL}/register?provider=google`} icon={<GoogleColor />}>
            Google
          </SocialButton>
        </div>

        <p className="text-[13px] text-center mt-3 text-[#525666]">
          Already have an account?{' '}
          <a href={`${DASHBOARD_URL}/login`} className="underline" style={{ color: '#0d0e0d' }}>
            Log in
          </a>
        </p>
      </form>
    </motion.div>
  )
}

function Field({
  label, type, value, onChange, placeholder, required,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] text-[#525666] mb-1.5 font-medium">{label}</span>
      <div className="relative">
        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a5b2]" />
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-3 rounded-md text-[14px] text-[#0d0e0d] placeholder:text-[#a1a5b2] outline-none transition-colors"
          style={{
            background: '#fff',
            border: '1px solid #d8dae0',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#d8dae0')}
        />
      </div>
    </label>
  )
}

function SocialButton({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 h-11 rounded-md text-[13px] font-medium text-[#0d0e0d] transition-colors cursor-pointer"
      style={{ background: '#fff', border: '1px solid #d8dae0' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#a1a5b2')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d8dae0')}
    >
      {icon}
      {children}
    </a>
  )
}

function GoogleColor() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.838.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  )
}

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden text-white">
      <ShaderBackground />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),' +
            ' linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-32 pb-16 lg:pb-28">
        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-12 lg:gap-16 items-start">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="leading-[1.05] tracking-tight"
              style={{
                fontSize: 'clamp(36px, 5.4vw, 60px)',
                fontWeight: 500,
                letterSpacing: '-0.025em',
              }}
            >
              The India-first
              <br />
              cloud platform for{' '}
              <em
                className="not-italic"
                style={{
                  background: 'linear-gradient(120deg, #c8f135 0%, #a3e635 60%, #84cc16 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                shipping fast.
              </em>
            </h1>

            <p
              className="mt-7 max-w-xl text-white/75 leading-[1.65]"
              style={{ fontSize: 'clamp(15px, 1.3vw, 18px)' }}
            >
              Cloud VPS, bare metal, GPU instances, managed databases, and load
              balancers across 15 regions. Built on real KVM with 30-second
              deploys and per-second billing.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={`${DASHBOARD_URL}/register`}
                className="group inline-flex items-center justify-between gap-4 rounded-md h-12 pl-6 pr-5 transition-colors cursor-pointer min-w-[210px]"
                style={{ background: 'var(--brand)', color: '#0d0e0d' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-h)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand)')}
              >
                <span className="text-[14.5px] font-semibold">Get started</span>
                <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
              </a>
              <a
                href="mailto:sales@netlayer.com"
                className="inline-flex items-center justify-center px-6 h-12 rounded-md text-[14.5px] text-white/90 transition-colors cursor-pointer"
                style={{ border: '1px solid rgba(255,255,255,0.25)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              >
                Talk to sales
              </a>
            </div>

            <div
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              <Pill>30-sec deploys</Pill>
              <Pill>Per-second billing</Pill>
              <Pill>India-GST invoices</Pill>
              <Pill>SOC2 Ready</Pill>
            </div>
          </motion.div>

          {/* Right — signup card */}
          <SignupCard />
        </div>
      </div>
    </section>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: 'var(--brand)' }} />
      {children}
    </span>
  )
}
