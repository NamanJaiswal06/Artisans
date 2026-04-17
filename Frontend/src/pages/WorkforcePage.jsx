import { useState, useEffect } from 'react'
import { workforceDashboard, rolesTaxonomy, recentEvents, upsertProfile } from '../services/api'
import toast from 'react-hot-toast'

export default function WorkforcePage() {
  const [summary, setSummary] = useState(null)
  const [events, setEvents] = useState([])
  const [profile, setProfile] = useState({ employee_id: '', email: '', department: '' })

  useEffect(() => {
    workforceDashboard().then(r => setSummary(r.data)).catch(console.error)
    recentEvents(10).then(r => setEvents(r.data)).catch(console.error)
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await upsertProfile(profile)
      toast.success('Profile added')
      workforceDashboard().then(r => setSummary(r.data))
    } catch { toast.error('Failed') }
  }

  return (
    <div className="fade-in">
      <h2>Workforce Risk Intelligence</h2>
      
      <div className="grid3" style={{ marginBottom: 24, marginTop: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Profiles</div>
          <div className="stat-value">{summary?.total_profiles || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Resilience</div>
          <div className="stat-value">{summary?.avg_resilience ? summary.avg_resilience.toFixed(2) : '0'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical Users</div>
          <div className="stat-value">{summary?.total_profiles || 0}</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h4>Upsert Profile</h4>
          <form style={{ marginTop: 16 }} onSubmit={handleAdd}>
             <input className="form-input mb-3" placeholder="Emp ID" value={profile.employee_id} onChange={e=>setProfile({...profile, employee_id: e.target.value})} />
             <input className="form-input mb-3" placeholder="Email" style={{ marginTop: 8 }} value={profile.email} onChange={e=>setProfile({...profile, email: e.target.value})} />
             <input className="form-input mb-3" placeholder="Department" style={{ marginTop: 8 }} value={profile.department} onChange={e=>setProfile({...profile, department: e.target.value})} />
             <button className="btn btn-primary" style={{ marginTop: 12 }}>Save Profile</button>
          </form>
        </div>

        <div className="card">
          <h4>Recent Workforce Events</h4>
          <div style={{ marginTop: 16 }}>
             {events.length === 0 ? <p className="text-muted">No events</p> : events.map((e, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="badge badge-accent">{e.topic}</div>
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>{JSON.stringify(e.payload)}</div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
