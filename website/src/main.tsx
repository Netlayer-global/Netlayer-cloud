import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './styles/tokens.css'
import './styles/globals.css'

import { applyInitialTheme } from './hooks/useTheme'
import { ThemeToggle } from './components/ThemeToggle'

import Landing from './pages/Landing'
import PricingPage from './pages/public/PricingPage'
import NetworkPage from './pages/public/NetworkPage'
import StatusPage from './pages/public/StatusPage'
import DocsPage from './pages/public/DocsPage'
import FeaturesPage from './pages/public/FeaturesPage'
import KubernetesPage from './pages/public/KubernetesPage'
import AbuseReportPage from './pages/public/AbuseReportPage'
import AboutPage from './pages/public/AboutPage'
import CareersPage from './pages/public/CareersPage'
import PrivacyPage from './pages/public/PrivacyPage'
import TermsPage from './pages/public/TermsPage'
import BlogPage from './pages/public/BlogPage'
import BlogPostPage from './pages/public/BlogPostPage'
import MarketplacePage from './pages/public/MarketplacePage'

/**
 * Public marketing site entry. Auth-gated routes (login, register,
 * dashboard, admin) live in the dashboard at frontend/ — links here
 * navigate to the dashboard origin via env-configurable URL.
 *
 * Production deployment splits paths via Caddy:
 *   /            → website (this app)
 *   /pricing     → website
 *   /docs        → website
 *   /login       → dashboard
 *   /register    → dashboard
 *   /dashboard/* → dashboard
 *   /admin/*     → dashboard
 */

// Set the data-theme attribute before React mounts so first paint
// already matches the user's theme — no flash.
applyInitialTheme()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeToggle />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/kubernetes" element={<KubernetesPage />} />
          <Route path="/abuse-report" element={<AbuseReportPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
