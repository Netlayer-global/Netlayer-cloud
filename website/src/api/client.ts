import axios from 'axios'

/**
 * Minimal axios client for the public website. No auth header — only
 * hits public endpoints (/api/plans, /api/blog, /api/platform/*, /api/status,
 * /api/waitlist, /api/abuse, /api/marketplace).
 *
 * The dashboard frontend at frontend/ has its own client with JWT
 * interceptors and refresh logic; that complexity is not needed here.
 */
const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
})

export default api
