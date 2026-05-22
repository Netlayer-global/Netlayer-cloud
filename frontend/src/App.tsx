import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Cpu, Hexagon, Database, Network, Monitor, Users, Folder, Activity } from 'lucide-react'

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

import Home from './pages/Home'
import Servers from './pages/Servers'
import ServerDetail from './pages/ServerDetail'
import DeployServer from './pages/DeployServer'
import Billing from './pages/Billing'
import SshKeys from './pages/SshKeys'
import Settings from './pages/Settings'
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
            <Route path="settings" element={<Settings />} />
            <Route path="projects"  element={<Placeholder title="Projects"        description="Group your infrastructure by environment." icon={<Folder size={28} />} />} />
            <Route path="activity"  element={<Placeholder title="Activity"        description="Audit log of all actions on your account."  icon={<Activity size={28} />} />} />
            <Route path="vms"       element={<Placeholder title="Virtual machines" description="Lightweight VMs for fast workloads."        icon={<Cpu size={28} />} />} />
            <Route path="k8s"       element={<Placeholder title="Kubernetes"      description="Managed Kubernetes clusters in one click." icon={<Hexagon size={28} />} />} />
            <Route path="storage"   element={<Placeholder title="Storage"         description="Block and object storage volumes."         icon={<Database size={28} />} />} />
            <Route path="network"   element={<Placeholder title="Network"         description="Private networks, floating IPs, firewalls." icon={<Network size={28} />} />} />
            <Route path="gpu"       element={<Placeholder title="GPU instances"   description="On-demand GPUs for AI / ML workloads."     icon={<Monitor size={28} />} />} />
            <Route path="team"      element={<Placeholder title="Team settings"   description="Invite teammates and manage roles."        icon={<Users size={28} />} />} />
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
            <Route path="settings"      element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
