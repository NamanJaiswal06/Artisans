import { useState, useEffect } from 'react'
import { listCases, setCaseStatus } from '../services/api'
import toast from 'react-hot-toast'

export default function CasesPage() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCases = () => {
    setLoading(true)
    listCases().then(res => {
      setCases(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchCases() }, [])

  const handleResolve = async (id) => {
    try {
      await setCaseStatus(id, 'resolved')
      toast.success('Case resolved')
      fetchCases()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="fade-in">
      <h2>Automated Cases</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Manage triggered playbook tasks.</p>

      <div className="card">
        {loading ? <div className="loading-spinner" style={{ margin: '40px auto' }}></div> :
         cases.length === 0 ? <div className="empty-state">No open cases.</div> : (
           <div className="table-wrap">
             <table>
               <thead>
                 <tr>
                   <th>Case ID</th>
                   <th>Status</th>
                   <th>Playbook</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {cases.map(c => (
                   <tr key={c.case_id}>
                     <td><span className="badge badge-neutral">{c.case_id.substring(0, 8)}...</span></td>
                     <td><span className="badge badge-warning">{c.status}</span></td>
                     <td>{c.playbook_id}</td>
                     <td>
                       <button className="btn btn-sm btn-ghost" onClick={() => handleResolve(c.case_id)}>Resolve</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
      </div>
    </div>
  )
}
