/**
 * landing-v3 — modular sections of the public marketing site.
 *
 * The full landing page (`pages/Landing.tsx`) is a thin orchestrator that
 * composes these section files in order. Other public pages (Pricing,
 * About, Docs, etc.) re-import LandingNav / LandingFooter / PricingSection.
 *
 * Round 25: TopBanner, AnnouncementBar (stat strip), PartnersSection
 * (logo strip), and ResourcesSection added — sections inspired by Vultr's
 * structure but with NetLayer's lime-on-dark palette and unique copy.
 */
export { LandingNav } from './LandingNav'
export { LandingFooter } from './LandingFooter'
export { TopBanner } from './TopBanner'
export { HeroSection } from './HeroSection'
export { TickerStrip } from './TickerStrip'
export { AnnouncementBar } from './AnnouncementBar'
export { StatsBar } from './StatsBar'
export { ProductsSection } from './ProductsSection'
export { PerformanceSection } from './PerformanceSection'
export { GlobalNetworkSection } from './GlobalNetworkSection'
export { PricingSection } from './PricingSection'
export { DeveloperSection } from './DeveloperSection'
export { MarketplaceSection } from './MarketplaceSection'
export { TrustSection } from './TrustSection'
export { TestimonialsSection } from './TestimonialsSection'
export { CTASection } from './CTASection'
export { PartnersSection } from './PartnersSection'
export { ResourcesSection } from './ResourcesSection'
export { SectionHeader } from './SectionHeader'
export { PageHero } from './PageHero'
export { CtaBand } from './CtaBand'
export { Reveal } from './Reveal'
