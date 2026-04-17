import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import DetectionPage from './pages/DetectionPage'
import RiskPage from './pages/RiskPage'
import IncidentsPage from './pages/IncidentsPage'
import CasesPage from './pages/CasesPage'
import WorkforcePage from './pages/WorkforcePage'
import IngestPage from './pages/IngestPage'
import IntegrationsPage from './pages/IntegrationsPage'
import ProfileStorePage from './pages/ProfileStorePage'
import PhishingScannerPage from './pages/PhishingScannerPage'

function PrivateRoute({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh' }}><div className="loading-spinner"/></div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index           element={<Dashboard />} />
            <Route path="detect"   element={<DetectionPage />} />
            <Route path="risk"     element={<RiskPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="cases"    element={<CasesPage />} />
            <Route path="workforce" element={<WorkforcePage />} />
            <Route path="ingest"   element={<IngestPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="store"    element={<ProfileStorePage />} />
            <Route path="scanner"  element={<PhishingScannerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
