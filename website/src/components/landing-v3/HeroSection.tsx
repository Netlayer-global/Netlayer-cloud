import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Globe, Lock, Shield, Zap } from 'lucide-react'

/**
 * HeroSection — above-the-fold of the public marketing site.
 *
 * Two visual layers:
 *   1. WebGL shader background — animated low-frequency noise, very dark,
 *      with a faint lime-green tint. Pure GLSL, ~1KB, no external deps.
 *      Falls back to a solid colour if WebGL2 is unavailable.
 *   2. Animated server rack on the right — five rack units stacked with a
 *      perspective transform; each unit has a pulsing status LED + a
 *      bandwidth bar that fills on mount. Built with framer-motion so the
 *      entrance is staggered.
 *
 * The hero also drives the marketing site's primary CTA (Deploy now) which
 * links across to the dashboard origin where the customer signs up.
 */

const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

// Tiny full-screen WebGL2 noise shader. Cleaned up + tuned for Tailwind v3
// (no CSS variables — colours are hard-coded inside the fragment shader).
const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
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

  float t = time * 0.25;

  vec2 p = st * 2.0;
  float n1 = noise(p + t);
  float n2 = noise(p * 2.0 - t * 0.5);
  float n3 = noise(p * 4.0 + t * 0.3);

  float pattern = n1 * 0.55 + n2 * 0.30 + n3 * 0.15;

  vec3 deepBg   = vec3(0.043, 0.047, 0.043);   // ~#0b0c0b
  vec3 midBg    = vec3(0.075, 0.082, 0.075);   // ~#131513
  vec3 brand    = vec3(0.878, 0.996, 0.337);   // #e0fe56

  vec3 col = mix(deepBg, midBg, pattern);
  col += brand * pattern * 0.04;

  // Vignette to darken the corners
  float vignette = 1.0 - length(uv - 0.5) * 0.6;
  col *= clamp(vignette, 0.55, 1.0);

  O = vec4(col, 1.0);
}`

const VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;
in vec4 position;
void main() { gl_Position = position; }`

function ShaderBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null
    if (!gl) return // older browser — solid background fallback below

    const vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, VERTEX_SHADER)
    gl.compileShader(vs)

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, FRAGMENT_SHADER)
    gl.compileShader(fs)

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW)
    const positionLoc = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    const resolutionUniform = gl.getUniformLocation(program, 'resolution')
    const timeUniform = gl.getUniformLocation(program, 'time')

    const dpr = Math.max(1, Math.min(window.devicePixelRatio, 2))
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    const start = performance.now()
    const loop = () => {
      const t = (performance.now() - start) * 0.001
      gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
      gl.uniform1f(timeUniform, t)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full block"
      style={{ background: '#0b0c0b' }}
      aria-hidden="true"
    />
  )
}

/**
 * 3D server rack visual. Built from regular divs with a perspective
 * wrapper — no Three.js, ~3 KB rendered. Each unit has a status light
 * and a load bar so the visual feels alive without a video file.
 */
function ServerRack3D() {
  const units = [
    { name: 'BOM1 · web-1',  load: 64, status: 'green' },
    { name: 'BOM1 · db-1',   load: 88, status: 'green' },
    { name: 'BLR1 · cache',  load: 31, status: 'lime'  },
    { name: 'DEL1 · build',  load: 47, status: 'green' },
    { name: 'SIN1 · proxy',  load: 22, status: 'lime'  },
  ]

  return (
    <div className="relative w-full flex items-center justify-center select-none">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.92, rotateY: -12 }}
        animate={{ opacity: 1, scale: 1, rotateY: -8 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ perspective: 1400, transformStyle: 'preserve-3d' }}
      >
        {/* Outer rack frame */}
        <div
          className="relative rounded-lg p-3"
          style={{
            background: 'linear-gradient(180deg, rgba(34,36,34,.9) 0%, rgba(15,17,15,.95) 100%)',
            border: '1px solid rgba(224,254,86,0.15)',
            boxShadow:
              '0 30px 70px -20px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.04)',
            transformStyle: 'preserve-3d',
            transform: 'rotateY(-6deg) rotateX(4deg)',
          }}
        >
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#e0fe56] shadow-[0_0_8px_rgba(224,254,86,0.6)]" />
              <span className="text-[10px] uppercase tracking-[.18em] text-white/60">
                rack-A1 · 99.99%
              </span>
            </div>
            <span className="text-[10px] tabular-nums text-white/40 font-mono">5/24 U</span>
          </div>

          <div className="space-y-1.5">
            {units.map((u, i) => (
              <motion.div
                key={u.name}
                className="relative w-72 sm:w-80 lg:w-[22rem] h-12 rounded-md overflow-hidden"
                style={{
                  background:
                    'linear-gradient(180deg, #2a2c2a 0%, #1c1e1c 60%, #15171582 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transform: `translateZ(${(units.length - i) * 6}px)`,
                }}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.08, duration: 0.5 }}
              >
                <div className="absolute inset-0 flex items-center px-3 gap-3">
                  {/* Status LED */}
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        u.status === 'lime' ? '#e0fe56' : '#22c55e',
                      boxShadow:
                        u.status === 'lime'
                          ? '0 0 10px rgba(224,254,86,0.8)'
                          : '0 0 10px rgba(34,197,94,0.7)',
                    }}
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />

                  {/* Drive bay slots */}
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <span
                        key={j}
                        className="w-1.5 h-7 rounded-sm"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      />
                    ))}
                  </div>

                  {/* Hostname + load bar */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10.5px] font-mono text-white/70 truncate">
                        {u.name}
                      </span>
                      <span className="text-[10px] font-mono text-white/40 tabular-nums">
                        {u.load}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background:
                            'linear-gradient(90deg, #e0fe56 0%, #a3e635 100%)',
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${u.load}%` }}
                        transition={{ duration: 1.4, delay: 1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-between px-2 pt-2 mt-2 border-t border-white/5">
            <span className="text-[10px] uppercase tracking-[.18em] text-white/40">
              25 Gbps NIC
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-0.5 rounded-sm bg-[#e0fe56]"
                  initial={{ height: 4 }}
                  animate={{ height: [4, 10 + Math.random() * 6, 4] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Floor reflection */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 top-full w-[80%] h-12 rounded-full blur-2xl opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(224,254,86,0.35), transparent 70%)',
          }}
        />
      </motion.div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden text-white">
      {/* Layer 1 — animated shader background */}
      <ShaderBackground />

      {/* Layer 2 — soft gradient over shader to push contrast where text sits */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* Layer 3 — subtle dot grid for texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7) 1px, transparent 1px) 0 0/24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Foreground content area below the shared LandingNav (rendered by Landing.tsx) */}
        <div className="flex-1 flex items-center px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-3 h-7 rounded-full mb-6"
                style={{
                  background: 'rgba(224,254,86,0.08)',
                  border: '1px solid rgba(224,254,86,0.25)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <Zap size={11} style={{ color: '#e0fe56' }} />
                <span className="text-[11.5px] font-medium text-white/85 tracking-wide">
                  Trusted by 50,000+ developers
                </span>
              </motion.div>

              <motion.h1
                className="font-medium tracking-tight leading-[1.05]"
                style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.7 }}
              >
                Infrastructure that{' '}
                <span
                  style={{
                    background:
                      'linear-gradient(135deg, #e0fe56 0%, #a3e635 80%, #84cc16 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  deploys in seconds.
                </span>
              </motion.h1>

              <motion.p
                className="mt-5 max-w-xl text-[15px] sm:text-[16px] text-white/70 leading-relaxed"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.6 }}
              >
                Bare metal servers, cloud VMs, and managed databases across{' '}
                <span className="text-white/90 font-medium">15 global regions</span>.
                Hardware-level isolation, 30-second provisioning, India-first pricing.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <a
                  href={`${DASHBOARD_URL}/register`}
                  className="group inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-semibold transition-all duration-200 cursor-pointer"
                  style={{ background: '#e0fe56', color: '#0d0e0d' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(224,254,86,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = ''
                  }}
                >
                  Deploy now — Free ₹3,500 credit
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </a>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 h-12 px-5 rounded-full text-[14px] font-medium text-white/90 transition-colors cursor-pointer"
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  View pricing <ArrowRight size={14} className="opacity-70" />
                </Link>
              </motion.div>

              <motion.p
                className="mt-4 text-[11.5px] text-white/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.5 }}
              >
                No credit card required · Cancel anytime
              </motion.p>

              <motion.div
                className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-1.5 text-white/65">
                  <Clock size={12} style={{ color: '#e0fe56' }} /> 30-second deploy
                </span>
                <span className="text-white/20">·</span>
                <span className="inline-flex items-center gap-1.5 text-white/65">
                  <Globe size={12} style={{ color: '#e0fe56' }} /> 15 regions
                </span>
                <span className="text-white/20">·</span>
                <span className="inline-flex items-center gap-1.5 text-white/65">
                  <Shield size={12} style={{ color: '#e0fe56' }} /> 99.99% SLA
                </span>
                <span className="text-white/20">·</span>
                <span className="inline-flex items-center gap-1.5 text-white/65">
                  <Lock size={12} style={{ color: '#e0fe56' }} /> SOC2 ready
                </span>
              </motion.div>
            </motion.div>

            {/* Right — 3D server rack */}
            <div className="hidden lg:flex items-center justify-end">
              <ServerRack3D />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
