/**
 * landing-v3 — modular sections of the public marketing site.
 *
 * The full landing page (`pages/Landing.tsx`) is now a thin orchestrator
 * that composes these section files in order. Other public pages
 * (Pricing, About, Docs, etc.) re-import LandingNav / LandingFooter /
 * PricingSection from here so they share the same chrome.
 *
 * Each file is small, single-responsibility, and free of imports back
 * into pages/Landing.tsx — that makes UI/UX iteration safe.
 */
export { LandingNav } from './LandingNav'
export { LandingFooter } from './LandingFooter'
export { HeroSection } from './HeroSection'
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
export { SectionHeader } from './SectionHeader'
