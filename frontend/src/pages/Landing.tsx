import { TopNavV2 } from '../components/landing-v2/TopNavV2'
import { HeroV2 } from '../components/landing-v2/HeroV2'
import { LogoWall } from '../components/landing-v2/LogoWall'
import { StatsBarV2 } from '../components/landing-v2/StatsBarV2'
import { ProductsV2 } from '../components/landing-v2/ProductsV2'
import { BenchmarksV2 } from '../components/landing-v2/BenchmarksV2'
import { NetworkV2 } from '../components/landing-v2/NetworkV2'
import { DevExperienceV2 } from '../components/landing-v2/DevExperienceV2'
import { TrustV2 } from '../components/landing-v2/TrustV2'
import { CtaV2 } from '../components/landing-v2/CtaV2'
import { FooterV2 } from '../components/landing-v2/FooterV2'

/**
 * NetLayer Cloud — Landing v2
 *
 * Cinematic, motion-aware, dev-first landing page modelled after the design
 * language of Latitude.sh, Vercel, and Linear. Every section is a standalone
 * component under components/landing-v2/ so individual sections can evolve
 * (or be A/B tested) without touching the page composition.
 */
export default function Landing() {
  return (
    <div className="nl-page min-h-screen relative nl-noise overflow-x-hidden">
      <TopNavV2 />
      <main>
        <HeroV2 />
        <LogoWall />
        <StatsBarV2 />
        <ProductsV2 />
        <BenchmarksV2 />
        <NetworkV2 />
        <DevExperienceV2 />
        <TrustV2 />
        <CtaV2 />
      </main>
      <FooterV2 />
    </div>
  )
}
