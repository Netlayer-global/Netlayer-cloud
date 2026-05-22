import { TopNav } from '../components/landing/TopNav'
import { Hero } from '../components/landing/Hero'
import { StatsBar } from '../components/landing/StatsBar'
import { Products } from '../components/landing/Products'
import { Pricing } from '../components/landing/Pricing'
import { GlobalNetwork } from '../components/landing/GlobalNetwork'
import { Features } from '../components/landing/Features'
import { TechStack } from '../components/landing/TechStack'
import { Testimonials } from '../components/landing/Testimonials'
import { CTA } from '../components/landing/CTA'
import { Footer } from '../components/landing/Footer'

/**
 * Landing — DO/Vultr/Vercel-style hero + product story + pricing + network + CTA + footer.
 *
 * Background palette is pinned to #0a0a0a (near-black) with #0070f3 primary
 * and #00d4ff cyan accents. Sections are independent components living in
 * components/landing/ so each can evolve in isolation.
 */
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />
      <main>
        <Hero />
        <StatsBar />
        <Products />
        <Pricing />
        <GlobalNetwork />
        <Features />
        <TechStack />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
