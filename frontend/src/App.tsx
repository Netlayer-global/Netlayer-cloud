import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Cpu, Hexagon, Database, Network, Monitor, Users, Folder } from 'lucide-react'

import { DashboardLayout } from './components/Layout'
import { ProtectedRoute, AdminRoute, PublicOnly } from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import Home from './pages/Home'
import Servers from './pages/Servers'
import ServerDetail from './pages/ServerDetail'
import DeployServer from './pages/DeployServer'
import Billing from './pages/Billing'
import SshKeys from './pages/SshKeys'
import Settings from './pages/Settings'
import ObjectStorage from './pages/ObjectStorage'
import BlockVolumes from './pages/BlockVolumes'
import LoadBalancers from './pages/LoadBalancers'
import ManagedDatabases from './pages/ManagedDatabases'
import VPCPage from './pages/VPC'
import DnsZones from './pages/DnsZones'
import Marketplace from './pages/Marketplace'
import Monitoring from './pages/Monitoring'
import Activity from './pages/Activity'
import Placeholder from './pages/Placeholder'
import FloatingIPs from './pages/FloatingIPs'
import Alerts from './pages/Alerts'
import Snapshots from './pages/Snapshots'
import Onboarding from './pages/Onboarding'
import Console from './pages/Console'

import AdminLayout from './pages/Admin/Layout'
import AdminLogin from './pages/Admin/Login'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminUsers from './pages/Admin/Users'
import AdminServers from './pages/Admin/Servers'
import AdminNodes from './pages/Admin/Nodes'
import AdminBilling from './pages/Admin/Billing'
import AdminTickets, { AdminTicketDetail } from './pages/Admin/Tickets'
import AdminIntegrations from './pages/Admin/Integrations'
import AdminRoles from './pages/Admin/Roles'
import AdminAnnouncements from './pages/Admin/Announcements'
import AdminAuditLogs from './pages/Admin/AuditLogs'
import AdminSettings from './pages/Admin/Settings'
import AdminWorkflows from './pages/Admin/Workflows'
import AdminStatusPage from './pages/Admin/StatusManagement'
import AdminAbuse from './pages/Admin/Abuse'
import IpPoolsAdmin from './pages/Admin/IpPools'
import PromoAdmin from './pages/Admin/PromoAdmin'
import CapacityPlanning from './pages/Admin/CapacityPlanning'
import GlobalHealth from './pages/Admin/GlobalHealth'
import Communications from './pages/Admin/Communications'
import IsoLibrary from './pages/Admin/IsoLibrary'
import NetworksAdmin from './pages/Admin/NetworksAdmin'
import StorageAdmin from './pages/Admin/StorageAdmin'
import DnsAdmin from './pages/Admin/DnsAdmin'
import MarketplaceAdmin from './pages/Admin/MarketplaceAdmin'
import CreditNotesAdmin from './pages/Admin/CreditNotes'
import Gstr1Export from './pages/Admin/Gstr1Export'
import EnterpriseAdmin from './pages/Admin/Enterprise'
import PlansAdmin from './pages/Admin/PlansAdmin'
import OrgSettings from './pages/Admin/OrgSettings'
import CustomIsos from './pages/CustomIsos'
import DeployOrders from './pages/DeployOrders'
import PhoneVerify from './pages/PhoneVerify'
import Kyc from './pages/Kyc'
import Organizations from './pages/Organizations'
import OrganizationDetail from './pages/OrganizationDetail'
import AnalyticsAdmin from './pages/Admin/Analytics'
import FeatureFlagsAdmin from './pages/Admin/FeatureFlags'
import ComplianceAdmin from './pages/Admin/Compliance'
import KycReviewAdmin from './pages/Admin/KycReview'
import MasqueradeAdmin from './pages/Admin/Masquerade'
import InAppMessagesAdmin from './pages/Admin/InAppMessages'

import Referrals from './pages/Referrals'
import Support from './pages/Support'
import ApiKeys from './pages/ApiKeys'

import { ModuleGuard } from './components/ModuleGuard'

/**
 * Dashboard SPA — auth + customer dashboard + admin panel.
 *
 * The public marketing site (landing, pricing, docs, blog, status,
 * legal pages) lives in a separate Vite app at `website/`. In production
 * Caddy splits paths between the two; in development run `npm run dev`
 * in both folders (dashboard on 5173, website on 5174).
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
})

// In development, hitting `/` on the dashboard is more useful as a redirect
// to the running website than as a 404.
const WEBSITE_URL =
  import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5174'

function RootRedirect() {
  // If a customer types the dashboard origin's root, send them to the
  // marketing site. Returning users with a valid session land on /login
  // which auto-forwards to /dashboard via PublicOnly + ProtectedRoute.
  if (typeof window !== 'undefined') {
    window.location.replace(WEBSITE_URL)
  }
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: { background: '#161716', border: '1px solid #2a2b2a', color: '#e8e8e6' },
          }}
        />
        <Routes>
          {/* Public auth pages — kept on the dashboard origin so cookies
              work seamlessly. The marketing site links here for sign-in. */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Console — full-screen, no layout, but auth required */}
          <Route
            path="/console"
            element={
              <ProtectedRoute>
                <Console />
              </ProtectedRoute>
            }
          />

          {/* Onboarding — auth required, full-screen */}
          <Route
            path="/dashboard/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="servers" element={<Servers />} />
            <Route path="servers/:id" element={<ServerDetail />} />
            <Route path="deploy" element={<DeployServer />} />
            <Route path="billing" element={<Billing />} />
            <Route path="ssh-keys" element={<SshKeys />} />
            <Route path="api-keys" element={<ModuleGuard module="apiKeys"><ApiKeys /></ModuleGuard>} />
            <Route path="settings" element={<Settings />} />
            <Route path="projects"  element={<ModuleGuard module="projects"><Placeholder title="Projects"        description="Group your infrastructure by environment." icon={<Folder size={28} />} /></ModuleGuard>} />
            <Route path="vms"       element={<ModuleGuard module="vms"><Placeholder title="Virtual machines" description="Lightweight VMs for fast workloads."        icon={<Cpu size={28} />} /></ModuleGuard>} />
            <Route path="k8s"       element={<ModuleGuard module="kubernetes"><Placeholder title="Kubernetes"      description="Managed Kubernetes clusters in one click." icon={<Hexagon size={28} />} /></ModuleGuard>} />
            <Route path="storage"   element={<Placeholder title="Storage"         description="Block and object storage volumes."         icon={<Database size={28} />} />} />
            <Route path="storage/object" element={<ModuleGuard module="objectStorage"><ObjectStorage /></ModuleGuard>} />
            <Route path="storage/block"  element={<ModuleGuard module="blockStorage"><BlockVolumes /></ModuleGuard>} />
            <Route path="load-balancers" element={<ModuleGuard module="loadBalancers"><LoadBalancers /></ModuleGuard>} />
            <Route path="databases"      element={<ModuleGuard module="managedDb"><ManagedDatabases /></ModuleGuard>} />
            <Route path="vpc"            element={<ModuleGuard module="vpc"><VPCPage /></ModuleGuard>} />
            <Route path="dns"            element={<ModuleGuard module="dns"><DnsZones /></ModuleGuard>} />
            <Route path="marketplace"    element={<ModuleGuard module="marketplace"><Marketplace /></ModuleGuard>} />
            <Route path="monitoring"     element={<ModuleGuard module="monitoring"><Monitoring /></ModuleGuard>} />
            <Route path="activity"       element={<ModuleGuard module="activity"><Activity /></ModuleGuard>} />
            <Route path="referrals"      element={<ModuleGuard module="referrals"><Referrals /></ModuleGuard>} />
            <Route path="support"        element={<ModuleGuard module="support"><Support /></ModuleGuard>} />
            <Route path="support/:id"    element={<ModuleGuard module="support"><Support /></ModuleGuard>} />
            <Route path="floating-ips"   element={<ModuleGuard module="floatingIps"><FloatingIPs /></ModuleGuard>} />
            <Route path="alerts"         element={<ModuleGuard module="alerts"><Alerts /></ModuleGuard>} />
            <Route path="snapshots"      element={<ModuleGuard module="snapshots"><Snapshots /></ModuleGuard>} />
            <Route path="custom-isos"    element={<CustomIsos />} />
            <Route path="deploy-orders"  element={<DeployOrders />} />
            <Route path="phone-verify"           element={<PhoneVerify />} />
            <Route path="kyc"                    element={<Kyc />} />
            <Route path="organizations"          element={<Organizations />} />
            <Route path="organizations/:id"      element={<OrganizationDetail />} />
            <Route path="network"   element={<Placeholder title="Network"         description="Private networks, floating IPs, firewalls." icon={<Network size={28} />} />} />
            <Route path="gpu"       element={<ModuleGuard module="gpu"><Placeholder title="GPU instances"   description="On-demand GPUs for AI / ML workloads."     icon={<Monitor size={28} />} /></ModuleGuard>} />
            <Route path="team"      element={<ModuleGuard module="team"><Placeholder title="Team settings"   description="Invite teammates and manage roles."        icon={<Users size={28} />} /></ModuleGuard>} />
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<AdminDashboard />} />
            <Route path="users"         element={<AdminUsers />} />
            <Route path="servers"       element={<AdminServers />} />
            <Route path="nodes"         element={<AdminNodes />} />
            <Route path="billing"       element={<AdminBilling />} />
            <Route path="tickets"       element={<AdminTickets />} />
            <Route path="tickets/:id"   element={<AdminTicketDetail />} />
            <Route path="integrations"  element={<AdminIntegrations />} />
            <Route path="roles"         element={<AdminRoles />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="audit-logs"    element={<AdminAuditLogs />} />
            <Route path="workflows"     element={<AdminWorkflows />} />
            <Route path="status"        element={<AdminStatusPage />} />
            <Route path="abuse"         element={<AdminAbuse />} />
            <Route path="settings"      element={<AdminSettings />} />
            <Route path="ip-pools"       element={<IpPoolsAdmin />} />
            <Route path="iso"            element={<IsoLibrary />} />
            <Route path="promos"         element={<PromoAdmin />} />
            <Route path="capacity"       element={<CapacityPlanning />} />
            <Route path="health"         element={<GlobalHealth />} />
            <Route path="communications" element={<Communications />} />
            <Route path="networks"       element={<NetworksAdmin />} />
            <Route path="storage"        element={<StorageAdmin />} />
            <Route path="dns"            element={<DnsAdmin />} />
            <Route path="marketplace"    element={<MarketplaceAdmin />} />
            <Route path="credit-notes"   element={<CreditNotesAdmin />} />
            <Route path="gstr1"          element={<Gstr1Export />} />
            <Route path="enterprise"     element={<EnterpriseAdmin />} />
            <Route path="plans"          element={<PlansAdmin />} />
            <Route path="org-settings"   element={<OrgSettings />} />
            <Route path="analytics"        element={<AnalyticsAdmin />} />
            <Route path="feature-flags"    element={<FeatureFlagsAdmin />} />
            <Route path="compliance"       element={<ComplianceAdmin />} />
            <Route path="kyc-review"       element={<KycReviewAdmin />} />
            <Route path="masquerade"       element={<MasqueradeAdmin />} />
            <Route path="in-app-messages"  element={<InAppMessagesAdmin /> } />
          </Route>

          {/* Anything else — bounce to website */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
