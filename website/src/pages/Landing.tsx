/**
 * Landing — home page (DigitalOcean-style, NetLayer lime theme).
 *
 * Flow (clean, airy, rounded-card DO aesthetic):
 *   TopBanner          — promo strip
 *   LandingNav         — sticky nav (inline theme toggle)
 *   HeroSection        — two-col hero (copy + console visual)
 *   PartnersSection    — "trusted by" wordmark strip
 *   AnnouncementBar    — three proof / customer-story stat cards
 *   ProductsSection    — "one platform" product card grid
 *   PerformanceSection — alternating feature rows with visuals
 *   MarketplaceSection — full console mockup
 *   GlobalNetworkSection — region card grid
 *   TrustSection       — compliance badges
 *   CTASection         — centered CTA panel
 *   LandingFooter      — sitemap + newsletter
 *
 * Other public pages reuse LandingNav / LandingFooter / PricingSection.
 */
import {
  TopBanner,
  LandingNav,
  HeroSection,
  PartnersSection,
  AnnouncementBar,
  ProductsSection,
  PerformanceSection,
  MarketplaceSection,
  GlobalNetworkSection,
  TrustSection,
  CTASection,
  LandingFooter,
} from '../components/landing-v3'

export default function Landing() {
  return (
    <div className="nl-v3">
      <TopBanner />
      <LandingNav />
      <HeroSection />
      <PartnersSection />
      <AnnouncementBar />
      <ProductsSection />
      <PerformanceSection />
      <MarketplaceSection />
      <GlobalNetworkSection />
      <TrustSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}

// Re-exports for the supporting public pages.
export { LandingNav, LandingFooter } from '../components/landing-v3'
export { PricingSection } from '../components/landing-v3'
