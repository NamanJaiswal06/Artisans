import { useState, useEffect } from 'react'
import { listAdapters } from '../services/api'

export default function IntegrationsPage() {
  const [adapters, setAdapters] = useState([])
  
  useEffect(() => {
    listAdapters().then(res => setAdapters(res.data || [])).catch(console.error)
  }, [])

  return (
    <div className="fade-in">
      <h2>Security Integrations</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Configured third-party security connectors.</p>
      
      <div className="grid3">
        {adapters.map((a, i) => (
          <div key={i} className="card">
             <div style={{ fontSize: 24, marginBottom: 12 }}>{a.name.includes('splunk') ? '🟢' : a.name.includes('crowdstrike') ? '🦅' : '🔌'}</div>
             <h4 style={{ textTransform: 'capitalize' }}>{a.name.replace('_', ' ')}</h4>
             <div style={{ marginTop: 8 }}>
               <span className="badge badge-success">Active</span>
               <span className="badge badge-accent" style={{ marginLeft: 8 }}>{a.description.split(' ')[0]} API</span>
             </div>
          </div>
        ))}
        {adapters.length === 0 && <p className="text-muted">No adapters found.</p>}
      </div>
    </div>
  )
}
