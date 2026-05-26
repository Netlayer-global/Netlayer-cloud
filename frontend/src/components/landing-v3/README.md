# landing-v3 — modular public landing-page sections

The marketing site is composed by `pages/Landing.tsx`, which now is a thin
~30-line orchestrator. Each section lives here as its own file, so UI/UX
iteration is fast and PR diffs stay small.

## Sections

| File | Purpose |
|---|---|
| `LandingNav.tsx` | Sticky top nav with Products dropdown + mobile menu |
| `HeroSection.tsx` | Above-the-fold headline + CTAs + animated terminal |
| `StatsBar.tsx` | 4-column animated counter strip (live API stats) |
| `ProductsSection.tsx` | 6-tile grid of platform offerings |
| `PerformanceSection.tsx` | Benchmark bars + 6 differentiator features |
| `GlobalNetworkSection.tsx` | SVG world map + region pin pills |
| `PricingSection.tsx` | 3-tier plan grid (also reused on `/pricing`) |
| `DeveloperSection.tsx` | REST / CLI / Terraform code cards with copy |
| `MarketplaceSection.tsx` | 12-app one-click install grid |
| `TrustSection.tsx` | Compliance badges + live platform status |
| `TestimonialsSection.tsx` | 3 customer quote cards |
| `CTASection.tsx` | Pre-footer "create free account" |
| `LandingFooter.tsx` | Brand mark + 3 link columns + social icons |
| `SectionHeader.tsx` | Shared eyebrow / title / subtitle helper |

## How `pages/Landing.tsx` works

```tsx
import {
  LandingNav, HeroSection, StatsBar, ProductsSection,
  PerformanceSection, GlobalNetworkSection, PricingSection,
  DeveloperSection, MarketplaceSection, TrustSection,
  TestimonialsSection, CTASection, LandingFooter,
} from '../components/landing-v3'

export default function Landing() {
  return (
    <div className="nl-v3">
      <LandingNav />
      <HeroSection />
      ...
      <LandingFooter />
    </div>
  )
}
```

## How to edit a section

1. Open the matching file (e.g. `HeroSection.tsx`).
2. Make your change.
3. Vite hot-reloads instantly. The other sections are untouched.

## How to add a new section

1. Create `MyNewSection.tsx` in this folder, exporting a named function.
2. Add `export { MyNewSection } from './MyNewSection'` to `index.ts`.
3. Import + render it in `pages/Landing.tsx` between two existing sections.

## Public pages that depend on this folder

These import directly from `components/landing-v3` (or via `pages/Landing.tsx`'s
re-exports for backward compatibility):

- `pages/public/PricingPage.tsx` → `LandingNav`, `LandingFooter`, `PricingSection`
- `pages/public/AboutPage.tsx` → `LandingNav`, `LandingFooter`
- `pages/public/CareersPage.tsx` → `LandingNav`, `LandingFooter`
- `pages/public/DocsPage.tsx` → `LandingNav`, `LandingFooter`
- `pages/public/FeaturesPage.tsx` → `LandingNav`, `LandingFooter`
- `pages/public/KubernetesPage.tsx` → `LandingNav`, `LandingFooter`
- `pages/public/MarketplacePage.tsx` → `LandingNav`, `LandingFooter`
- `pages/public/NetworkPage.tsx` → `LandingNav`, `LandingFooter`
- `pages/public/PrivacyPage.tsx` → `LandingNav`, `LandingFooter`
- `pages/public/StatusPage.tsx` → `LandingNav`, `LandingFooter`
- `pages/public/TermsPage.tsx` → `LandingNav`, `LandingFooter`

If you rename or remove an exported component, update these consumers.
