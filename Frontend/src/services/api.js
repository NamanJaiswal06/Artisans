import axios from 'axios'

const BASE = 'http://localhost:5000'

const api = axios.create({ baseURL: BASE })

// Attach JWT to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('narip_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const sendOtp   = (email) => api.post('/auth/send-otp', { email })
export const signup    = (data)  => api.post('/auth/signup', data)
export const login     = (data)  => api.post('/auth/login', data)

// Store
export const storeThreat = (data) => api.post('/api/v1/store', data)

// Detection
export const detectPhishing  = (data) => api.post('/api/v1/detect/phishing', data)
export const detectBEC       = (data) => api.post('/api/v1/detect/bec', data)
export const detectWireFraud = (data) => api.post('/api/v1/detect/wire-fraud', data)
export const detectSupply    = (data) => api.post('/api/v1/detect/supply-chain', data)
export const detectOTP       = (data) => api.post('/api/v1/detect/otp-fraud', data)
export const detectATO       = (data) => api.post('/api/v1/detect/account-takeover', data)
export const detectLateral   = (data) => api.post('/api/v1/detect/lateral-exfiltration', data)

// Risk
export const riskScore    = (data) => api.post('/api/v1/risk/score', data)
export const riskSnapshot = ()     => api.get('/api/v1/risk/snapshot')

// Incidents
export const recentIncidents = (limit = 50) => api.get(`/api/v1/incidents/recent?limit=${limit}`)

// Automation
export const listCases      = ()           => api.get('/api/v1/automation/cases')
export const getCase        = (id)         => api.get(`/api/v1/automation/cases/${id}`)
export const setCaseStatus  = (id, status) => api.post(`/api/v1/automation/cases/${id}/status`, { status })
export const listPlaybooks  = ()           => api.get('/api/v1/automation/playbooks')

// Integrations
export const listAdapters = () => api.get('/api/v1/integrations/adapters')

// Ingest
export const ingestFalconEvent = (data) => api.post('/api/v1/ingest/falcon/event', data)

// Workforce
export const upsertProfile  = (data)       => api.post('/api/v1/workforce/profiles', data)
export const getProfile     = (empId)      => api.get(`/api/v1/workforce/profiles/${empId}`)
export const assessPhishing  = (data)      => api.post('/api/v1/workforce/phishing/assess', data)
export const recordSimulation = (data)     => api.post('/api/v1/workforce/phishing/simulation', data)
export const workforceDashboard = ()       => api.get('/api/v1/workforce/dashboard/summary')
export const rolesTaxonomy  = ()           => api.get('/api/v1/workforce/roles/taxonomy')
export const auditLogs      = (limit=100)  => api.get(`/api/v1/workforce/audit/logs?limit=${limit}`)
export const recentEvents   = (limit=50)   => api.get(`/api/v1/workforce/events/recent?limit=${limit}`)

// Threat intel
export const threatIntel = () => api.get('/api/v1/threat-intel/iocs')

// Health
export const healthCheck = () => api.get('/health')

export default api
