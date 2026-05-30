/**
 * Landing — editorial home page (Fireblox-inspired, NetLayer lime theme).
 *
 * Flow:
 *   TopBanner        — promo strip
 *   LandingNav       — flat sticky nav
 *   HeroSection      — giant display word + glowing lime sphere
 *   PartnersSection  — integration wordmark bar
 *   AnnouncementBar  — 3 big-number stats
 *   StatsBar         — keyword marquee
 *   ProductsSection  — "what we run" numbered hairline cards
 *   PerformanceSection — platform intro + orbit orb + advantage list
 *   MarketplaceSection — live console mockup
 *   GlobalNetworkSection — region node grid
 *   TrustSection     — compliance badges
 *   CTASection       — pre-footer push
 *   LandingFooter    — sitemap + newsletter
 *
 * Other public pages reuse LandingNav / LandingFooter / PricingSection.
 */
import {
  TopBanner,
  LandingNav,
  HeroSection,
  PartnersSection,
  AnnouncementBar,
  StatsBar,
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
      <StatsBar />
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
