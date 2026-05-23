import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Cpu, Hexagon, Database, Network, Monitor, Users, Folder } from 'lucide-react'

import { DashboardLayout } from './components/Layout'
import { ProtectedRoute, AdminRoute, PublicOnly } from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

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

import Referrals from './pages/Referrals'
import Support from './pages/Support'
import ApiKeys from './pages/ApiKeys'

import { ModuleGuard } from './components/ModuleGuard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
})

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
          {/* Public */}
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
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
