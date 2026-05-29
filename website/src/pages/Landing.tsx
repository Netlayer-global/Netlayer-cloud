/**
 * Landing — public marketing page (Round 25 layout).
 *
 * Section order (top to bottom):
 *   TopBanner       — promo strip
 *   LandingNav      — sticky nav (rendered via fixed position)
 *   HeroSection     — split hero with signup card
 *   AnnouncementBar — 4-column stat strip
 *   ProductsSection — Cloud / Bare Metal / GPU tabs
 *   PerformanceSection — benchmark bars + features
 *   GlobalNetworkSection — region grid
 *   PartnersSection — wordmark strip
 *   PricingSection  — 3-tier plan grid
 *   DeveloperSection — REST/CLI/Terraform code cards
 *   MarketplaceSection — 12 one-click apps
 *   TrustSection    — compliance pills
 *   TestimonialsSection — 3 customer quotes
 *   ResourcesSection — Docs / API / Blog cards
 *   CTASection      — final pre-footer push
 *   LandingFooter   — sitemap + socials
 *
 * Other public pages (/pricing, /docs, etc.) reuse LandingNav/Footer +
 * PricingSection from `components/landing-v3`. Re-exports below preserve
 * older `from '../Landing'` imports.
 */
import {
  LandingNav,
  TopBanner,
  HeroSection,
  AnnouncementBar,
  ProductsSection,
  PerformanceSection,
  GlobalNetworkSection,
  PartnersSection,
  PricingSection,
  DeveloperSection,
  MarketplaceSection,
  TrustSection,
  TestimonialsSection,
  ResourcesSection,
  CTASection,
  LandingFooter,
} from '../components/landing-v3'

export default function Landing() {
  return (
    <div className="nl-v3">
      <TopBanner />
      <LandingNav />
      <HeroSection />
      <AnnouncementBar />
      <ProductsSection />
      <PerformanceSection />
      <GlobalNetworkSection />
      <PartnersSection />
      <PricingSection />
      <DeveloperSection />
      <MarketplaceSection />
      <TrustSection />
      <TestimonialsSection />
      <ResourcesSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}

// Re-exports for backward compatibility with public pages that still
// import these names from `../Landing`.
export { LandingNav, LandingFooter, PricingSection }
