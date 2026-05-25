# landing-v3 — public landing page sections

The marketing/landing page is currently authored in `frontend/src/pages/Landing.tsx`
as a single file (~76 KB). This folder is the planned home for each section as
its own component so UI/UX iteration is easier. To migrate a section without
breaking imports, follow the recipe below.

## Recipe

1. **Pick a section function from `pages/Landing.tsx`.** The current
   sections in declaration order are:
   - `LandingNav`
   - `HeroSection`
   - `StatsBar`
   - `ProductsSection`
   - `PerformanceSection`
   - `GlobalNetworkSection`
   - `PricingSection` (also rendered standalone on `/pricing`)
   - `DeveloperSection`
   - `MarketplaceSection`
   - `TrustSection`
   - `TestimonialsSection`
   - `CTASection`
   - `LandingFooter`

2. **Create `frontend/src/components/landing-v3/<Section>.tsx`** and copy the
   function plus any helper functions it depends on (e.g. `NavLink`, `DropCol`
   for the nav, `SectionHeader` for the body sections, `CodeCard` for
   `DeveloperSection`).

3. **Re-export it from `Landing.tsx`** so the public pages that import
   `LandingNav`, `LandingFooter`, `PricingSection` from `../Landing` keep working:
   ```tsx
   export { LandingNav } from '../components/landing-v3/LandingNav'
   ```

4. **Run** `npm run build` from `frontend/` to confirm nothing was broken
   by the move.

## Why a recipe instead of doing all of it now

Each section relies on local helper functions and animation hooks that are
co-located in `Landing.tsx`. Splitting all 12 sections requires careful
plumbing of those helpers as well, which is best done one section per PR
to keep diffs reviewable. This README + the existing function structure
gives you a clear map for incremental work.

## Public pages currently importing from `pages/Landing`

These will keep working as long as the re-exports stay in place:

- `pages/public/PricingPage.tsx`            — uses `PricingSection`, `LandingNav`, `LandingFooter`
- `pages/public/AboutPage.tsx`              — uses `LandingNav`, `LandingFooter`
- `pages/public/CareersPage.tsx`            — uses `LandingNav`, `LandingFooter`
- `pages/public/DocsPage.tsx`               — uses `LandingNav`, `LandingFooter`
- `pages/public/FeaturesPage.tsx`           — uses `LandingNav`, `LandingFooter`
- `pages/public/KubernetesPage.tsx`         — uses `LandingNav`, `LandingFooter`
- `pages/public/MarketplacePage.tsx`        — uses `LandingNav`, `LandingFooter`
- `pages/public/NetworkPage.tsx`            — uses `LandingNav`, `LandingFooter`
- `pages/public/PrivacyPage.tsx`            — uses `LandingNav`, `LandingFooter`
- `pages/public/StatusPage.tsx`             — uses `LandingNav`, `LandingFooter`
- `pages/public/TermsPage.tsx`              — uses `LandingNav`, `LandingFooter`
