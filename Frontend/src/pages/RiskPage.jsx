import { useState } from 'react'
import { riskScore, riskSnapshot } from '../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function RiskPage() {
  const [activeTab, setActiveTab] = useState('email')
  const [params, setParams] = useState({
    email: { sender: 'ceo@evil.tk', subject: 'Wire this immediately', body_text: 'Wire $100,000 urgently' },
    transaction: { amount: 100000, sender_account: 'ACC-CORP', recipient_account: 'ACC-UNKNOWN' },
    flows: { src_ip: '10.0.0.5', dst_ip: '10.0.0.99', bytes_out: 3000000 },
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleParamChange = (category, field, value) => {
    setParams(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }))
  }

  const handleScore = async () => {
    try {
      setLoading(true)
      const payload = {
        email: params.email,
        transaction: { ...params.transaction, amount: Number(params.transaction.amount) },
        flows: [{ ...params.flows, bytes_out: Number(params.flows.bytes_out), dst_port: 445 }],
      }
      const { data } = await riskScore(payload)
      setResult(data)
      toast.success('Unified risk calculated')
    } catch {
      toast.error('Failed to compute risk score')
    } finally {
      setLoading(false)
    }
  }

  const handleSnapshot = async () => {
    try {
      setLoading(true)
      const { data } = await riskSnapshot()
      setResult(data)
      toast.success('Risk Snapshot retrieved')
    } catch {
      toast.error('Failed to fetch snapshot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <h2>Unified Enterprise Risk</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Multi-vector correlation engine. Add telemetry parameters across different event types to generate a unified Bayesian risk score.</p>
      
      <div className="grid-main-side">
        <div className="card">
          <div className="tabs">
            <button className={`tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>Email</button>
            <button className={`tab ${activeTab === 'transaction' ? 'active' : ''}`} onClick={() => setActiveTab('transaction')}>Transaction</button>
            <button className={`tab ${activeTab === 'flows' ? 'active' : ''}`} onClick={() => setActiveTab('flows')}>Network</button>
          </div>

          <div style={{ minHeight: 220 }}>
            {activeTab === 'email' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="form-group">
                  <label className="form-label">Email Sender</label>
                  <input className="form-input" value={params.email.sender} onChange={e => handleParamChange('email', 'sender', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={params.email.subject} onChange={e => handleParamChange('email', 'subject', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Body Text Extract</label>
                  <textarea className="form-textarea" value={params.email.body_text} onChange={e => handleParamChange('email', 'body_text', e.target.value)} />
                </div>
              </motion.div>
            )}

            {activeTab === 'transaction' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="form-group">
                  <label className="form-label">Transaction Amount</label>
                  <input className="form-input" type="number" value={params.transaction.amount} onChange={e => handleParamChange('transaction', 'amount', e.target.value)} />
                </div>
                <div className="grid2">
                  <div className="form-group">
                    <label className="form-label">Sender Account</label>
                    <input className="form-input" value={params.transaction.sender_account} onChange={e => handleParamChange('transaction', 'sender_account', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Account</label>
                    <input className="form-input" value={params.transaction.recipient_account} onChange={e => handleParamChange('transaction', 'recipient_account', e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'flows' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid2">
                  <div className="form-group">
                    <label className="form-label">Source IP</label>
                    <input className="form-input" value={params.flows.src_ip} onChange={e => handleParamChange('flows', 'src_ip', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination IP</label>
                    <input className="form-input" value={params.flows.dst_ip} onChange={e => handleParamChange('flows', 'dst_ip', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Bytes Transferred</label>
                  <input className="form-input" type="number" value={params.flows.bytes_out} onChange={e => handleParamChange('flows', 'bytes_out', e.target.value)} />
                </div>
              </motion.div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleScore} disabled={loading}>🔥 Calculate Unified Risk</button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleSnapshot} disabled={loading}>Get Baseline Snapshot</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: 12 }}>
            <h3 className="card-title">Orchestration Output</h3>
          </div>
          {result ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
               
               {/* Unified Meter */}
               <div style={{ textAlign: 'center', marginBottom: 24, background: 'var(--bg-card2)', padding: '24px 0', borderRadius: 16 }}>
                 <div className="score-ring" style={{ width: 140, height: 140 }}>
                   <svg width="140" height="140" viewBox="0 0 140 140">
                     <circle cx="70" cy="70" r="62" fill="none" stroke="var(--bg-card)" strokeWidth="14" />
                     <circle cx="70" cy="70" r="62" fill="none" stroke={result.enterprise_risk_score > 60 ? 'var(--danger)' : result.enterprise_risk_score > 30 ? 'var(--warning)' : 'var(--success)'} strokeWidth="14" strokeDasharray={`${result.enterprise_risk_score * 3.89} 389`} />
                   </svg>
                   <div className="score-text" style={{ fontSize: 36 }}>{Math.round(result.enterprise_risk_score)}</div>
                 </div>
                 <div style={{ marginTop: 16, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Unified Enterprise Risk</div>
                 <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Audit Ref: {result.audit_reference || 'N/A'}</span>
               </div>

               {/* Component Breakdown */}
               <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Underlying Detections</h4>
               <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                 
                 {Object.entries(result.component_scores || {}).map(([mod, score]) => (
                   <li key={mod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card2)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                     <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: 14 }}>{mod.replace('_', ' ')}</span>
                     <span className={`badge ${score > 60 ? 'badge-danger' : score > 1 ? 'badge-warning' : 'badge-neutral'}`}>Score: {Math.round(score)}</span>
                   </li>
                 ))}

                 {(!result.component_scores || Object.keys(result.component_scores).length === 0) && (
                   <div className="text-muted" style={{ fontSize: 13 }}>No anomalous components detected.</div>
                 )}
               </ul>

            </motion.div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ opacity: 0.15 }}>🕸️</div>
              <p>Submit context to calculate unified risk correlation map.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
