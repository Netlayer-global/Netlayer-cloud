import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface RegionPoint {
  city: string
  flag: string
  lat: number
  lng: number
}

const REGIONS: RegionPoint[] = [
  { city: 'Mumbai',      flag: '🇮🇳', lat: 19.08, lng: 72.88 },
  { city: 'Delhi',       flag: '🇮🇳', lat: 28.61, lng: 77.21 },
  { city: 'Singapore',   flag: '🇸🇬', lat: 1.35,  lng: 103.82 },
  { city: 'Tokyo',       flag: '🇯🇵', lat: 35.68, lng: 139.69 },
  { city: 'Seoul',       flag: '🇰🇷', lat: 37.56, lng: 126.97 },
  { city: 'Sydney',      flag: '🇦🇺', lat: -33.87, lng: 151.21 },
  { city: 'Frankfurt',   flag: '🇩🇪', lat: 50.11, lng: 8.68 },
  { city: 'London',      flag: '🇬🇧', lat: 51.51, lng: -0.13 },
  { city: 'Paris',       flag: '🇫🇷', lat: 48.86, lng: 2.35 },
  { city: 'Amsterdam',   flag: '🇳🇱', lat: 52.37, lng: 4.90 },
  { city: 'New York',    flag: '🇺🇸', lat: 40.71, lng: -74.01 },
  { city: 'Chicago',     flag: '🇺🇸', lat: 41.88, lng: -87.63 },
  { city: 'Los Angeles', flag: '🇺🇸', lat: 34.05, lng: -118.24 },
  { city: 'São Paulo',   flag: '🇧🇷', lat: -23.55, lng: -46.63 },
  { city: 'Dubai',       flag: '🇦🇪', lat: 25.20, lng: 55.27 },
]

function latLngToVec3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return new THREE.Vector3(x, y, z)
}

/**
 * Cinematic, low-poly Earth-style globe rendered with vanilla three.js.
 *
 * Why not @react-three/fiber: keeping the dependency footprint small
 * (~155KB raw vs +110KB for fiber/drei). This component renders a wire-frame
 * sphere of dots, plots NetLayer's 15 regions as glowing pins, draws Bezier
 * arcs between major hubs, auto-rotates, and respects prefers-reduced-motion.
 *
 * Mounted absolutely behind hero text — pointer-events: none so it never
 * steals interaction.
 */
export function Globe() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ─── Scene setup ─────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(0, 0, 220)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const setSize = () => {
      const { clientWidth: w, clientHeight: h } = container
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    setSize()
    const ro = new ResizeObserver(setSize)
    ro.observe(container)

    // ─── The globe sphere ────────────────────────────────────
    const RADIUS = 80
    const globe = new THREE.Group()
    scene.add(globe)

    // Inner solid sphere (semi-transparent fill so pins look "in front")
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0a0c12, transparent: true, opacity: 0.85,
    })
    const innerGeo = new THREE.SphereGeometry(RADIUS - 0.5, 64, 48)
    globe.add(new THREE.Mesh(innerGeo, innerMat))

    // Wireframe outer shell — gives the "tech" feel
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x4f8bff, transparent: true, opacity: 0.18,
    })
    const wireGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(RADIUS, 28, 18))
    globe.add(new THREE.LineSegments(wireGeo, wireMat))

    // Atmosphere glow ring
    const haloMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      uniforms: {
        glowColor: { value: new THREE.Color(0x4f8bff) },
        intensity: { value: 0.4 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        varying vec3 vNormal;
        void main() {
          float a = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0) * intensity;
          gl_FragColor = vec4(glowColor, a);
        }
      `,
    })
    const halo = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.2, 48, 32), haloMat)
    globe.add(halo)

    // ─── Region pins ─────────────────────────────────────────
    const pinGroup = new THREE.Group()
    globe.add(pinGroup)

    const pinPositions: THREE.Vector3[] = []
    REGIONS.forEach((r) => {
      const pos = latLngToVec3(r.lat, r.lng, RADIUS + 0.5)
      pinPositions.push(pos)

      // Core dot
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x4ad7ff })
      const coreGeo = new THREE.SphereGeometry(1.1, 16, 16)
      const core = new THREE.Mesh(coreGeo, coreMat)
      core.position.copy(pos)
      pinGroup.add(core)

      // Pulse ring (animated below)
      const ringGeo = new THREE.RingGeometry(1.3, 2.2, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x4ad7ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(pos)
      ring.lookAt(0, 0, 0)
      ;(ring as any).userData.basePos = pos.clone()
      ;(ring as any).userData.phase = Math.random() * Math.PI * 2
      pinGroup.add(ring)
    })

    // ─── Connection arcs between hubs ────────────────────────
    const HUB_PAIRS: [number, number][] = [
      [0, 2],   // Mumbai → Singapore
      [2, 3],   // Singapore → Tokyo
      [6, 10],  // Frankfurt → New York
      [7, 10],  // London → New York
      [10, 12], // NY → LA
      [14, 0],  // Dubai → Mumbai
      [12, 5],  // LA → Sydney
    ]

    const arcMat = new THREE.LineBasicMaterial({
      color: 0x4ad7ff, transparent: true, opacity: 0.5,
    })

    HUB_PAIRS.forEach(([i, j]) => {
      const a = pinPositions[i]
      const b = pinPositions[j]
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(RADIUS * 1.4)
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
      const points = curve.getPoints(48)
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      pinGroup.add(new THREE.Line(geo, arcMat))
    })

    // ─── Animation loop ──────────────────────────────────────
    let frame = 0
    let running = true
    const start = performance.now()
    const animate = () => {
      if (!running) return
      frame = requestAnimationFrame(animate)
      const t = (performance.now() - start) / 1000

      if (!reduceMotion) {
        globe.rotation.y = t * 0.12
      }

      // Pulse rings: scale + fade
      pinGroup.children.forEach((child) => {
        if ((child as any).userData?.phase !== undefined) {
          const phase = (t * 1.2 + (child as any).userData.phase) % 2
          const s = 1 + phase * 1.4
          child.scale.set(s, s, s)
          ;(child as any).material.opacity = Math.max(0, 0.6 - phase * 0.3)
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      running = false
      cancelAnimationFrame(frame)
      ro.disconnect()
      renderer.dispose()
      // Dispose of geometries/materials to release GPU memory
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose()
        if ((obj as THREE.Mesh).material) {
          const m = (obj as THREE.Mesh).material
          if (Array.isArray(m)) m.forEach((mat) => mat.dispose())
          else m.dispose()
        }
      })
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}
