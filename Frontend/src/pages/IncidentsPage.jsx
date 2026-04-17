import { useState, useEffect } from 'react'
import { recentIncidents } from '../services/api'
import { motion } from 'framer-motion'

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStream = () => {
    setLoading(true)
    recentIncidents(50).then(res => {
      // Safely handle arrays or object wrappers coming from API
      const data = Array.isArray(res.data) ? res.data : res.data.incidents || res.data.messages || []
      setIncidents(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchStream()
    // Poll every 10 seconds for new incidents
    const interval = setInterval(fetchStream, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Live Incident Stream</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="status-dot"></div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Listening</span>
        </div>
      </div>

      <div className="card">
        {loading && incidents.length === 0 ? (
          <div className="loading-spinner" style={{ margin: '40px auto' }}></div>
        ) : incidents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p>No recent incidents detected in the message broker.</p>
            <span style={{ fontSize: 12, opacity: 0.6 }}>The system will automatically refresh when an anomaly is published.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Topic</th>
                  <th>Origin Target</th>
                  <th>Risk Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, i) => {
                  const payload = inc.payload || {}
                  return (
                    <motion.tr key={inc.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <td style={{ whiteSpace: 'nowrap', width: 180, fontSize: 12 }}>{new Date(inc.timestamp || Date.now()).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${inc.topic?.includes('high_risk') ? 'badge-danger' : 'badge-accent'}`}>
                          {inc.topic || 'System Event'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>
                        {payload.user_id || payload.employee_id || payload.sender || payload.audit_reference || 'System-Wide'}
                      </td>
                      <td>
                         {payload.score || payload.risk_score || payload.threat_score ? (
                           <span className="badge badge-warning" style={{ background: 'transparent', border: '1px solid var(--warning)' }}>
                             Critical: {payload.score || payload.risk_score || payload.threat_score}
                           </span>
                         ) : (
                           <span className="badge badge-info">Info / Telemetry</span>
                         )}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary">Review</button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
