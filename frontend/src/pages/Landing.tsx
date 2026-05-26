/**
 * Landing — the public marketing page.
 *
 * All sections live in `components/landing-v3/`. This file is a thin
 * orchestrator that composes them in the correct order. To add or
 * reorder sections, edit only this file. To restyle a section, edit
 * the matching file under `components/landing-v3/`.
 *
 * Other public pages (Pricing, About, Docs, etc.) import LandingNav /
 * LandingFooter / PricingSection from `components/landing-v3` directly
 * — Landing.tsx also re-exports them at the bottom so any older imports
 * `from '../Landing'` keep working.
 */
import {
  LandingNav,
  HeroSection,
  StatsBar,
  ProductsSection,
  PerformanceSection,
  GlobalNetworkSection,
  PricingSection,
  DeveloperSection,
  MarketplaceSection,
  TrustSection,
  TestimonialsSection,
  CTASection,
  LandingFooter,
} from '../components/landing-v3'

export default function Landing() {
  return (
    <div className="nl-v3">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <ProductsSection />
      <PerformanceSection />
      <GlobalNetworkSection />
      <PricingSection />
      <DeveloperSection />
      <MarketplaceSection />
      <TrustSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}

// Re-exports for backward compatibility with public pages that still
// import these names from `../Landing`.
export { LandingNav, LandingFooter, PricingSection }
