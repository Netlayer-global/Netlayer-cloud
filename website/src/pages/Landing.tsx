/**
 * Landing — premium editorial home page (VAULTEX-inspired, NetLayer lime theme).
 *
 * Flow:
 *   TopBanner        — promo strip
 *   LandingNav       — flat sticky nav (with inline theme toggle)
 *   HeroSection      — grid bg + floating KPI pills + serif stroke title
 *   TickerStrip      — live region latency/uptime ticker
 *   PartnersSection  — integration wordmark bar
 *   AnnouncementBar  — 3-cell stats band (hover lime underline)
 *   StatsBar         — keyword serif marquee
 *   ProductsSection  — numbered cards (01/06) with hover ↗ arrows
 *   PerformanceSection — split intro + feature list + advantage grid
 *   MarketplaceSection — refined console mockup
 *   GlobalNetworkSection — region node grid
 *   TrustSection     — compliance badges
 *   CTASection       — pre-footer push (radial glow)
 *   LandingFooter    — sitemap + newsletter
 *
 * Other public pages reuse LandingNav / LandingFooter / PricingSection.
 */
import {
  TopBanner,
  LandingNav,
  HeroSection,
  TickerStrip,
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
      <TickerStrip />
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
