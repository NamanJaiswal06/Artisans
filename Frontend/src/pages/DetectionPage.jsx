import { useState } from 'react'
import { detectPhishing, detectBEC, detectWireFraud, detectSupply, detectOTP, detectATO, detectLateral } from '../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function DetectionPage() {
  const [activeTab, setActiveTab] = useState('phishing')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  // Module-specific form states
  const [forms, setForms] = useState({
    phishing: { sender: '', subject: '', body_text: '', urls: '' },
    bec:      { sender: '', reply_to: '', subject: '', body_text: '' },
    wire:     { amount: '', sender_account: '', recipient_account: '' },
    otp:      { user_id: '', geo_lat: '', geo_lon: '' },
    ato:      { user_id: '', login_ip: '', privilege_level: '' },
  })

  const handleFormChange = (module, field, value) => {
    setForms(prev => ({
      ...prev,
      [module]: { ...prev[module], [field]: value }
    }))
  }

  const tabs = [
    { id: 'phishing', label: 'E-Mail Phishing' },
    { id: 'bec', label: 'BEC/Impersonation' },
    { id: 'wire', label: 'Wire Fraud' },
    { id: 'otp', label: 'OTP Fraud' },
    { id: 'ato', label: 'Account Takeover' },
  ]

  const handleTest = async () => {
    try {
      setLoading(true)
      setResult(null)
      let payload = {}
      let fn = null

      if (activeTab === 'phishing') {
        const f = forms.phishing
        payload = { sender: f.sender, subject: f.subject, body_text: f.body_text, urls: f.urls ? f.urls.split(',').map(u=>u.trim()) : [] }
        fn = detectPhishing
      } else if (activeTab === 'bec') {
        const f = forms.bec
        payload = { sender: f.sender, reply_to: f.reply_to, subject: f.subject, body_text: f.body_text }
        fn = detectBEC
      } else if (activeTab === 'wire') {
        const f = forms.wire
        payload = { amount: Number(f.amount), sender_account: f.sender_account, recipient_account: f.recipient_account, currency: 'USD' }
        fn = detectWireFraud
      } else if (activeTab === 'otp') {
        const f = forms.otp
        payload = { user_id: f.user_id, geo_lat: Number(f.geo_lat), geo_lon: Number(f.geo_lon), keystroke_dwell_ms: [80,90], keystroke_flight_ms: [100,110] }
        fn = detectOTP
      } else if (activeTab === 'ato') {
        const f = forms.ato
        payload = { user_id: f.user_id, login_ip: f.login_ip, privilege_level: Number(f.privilege_level) }
        fn = detectATO
      }

      const { data } = await fn(payload)
      setResult(data)
      toast.success('Analysis complete')
    } catch (err) {
      toast.error('Detection request failed')
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 24 }}>AI Threat Detection</h2>
      
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => { setActiveTab(t.id); setResult(null); }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid-main-side">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Event Parameters</h3>
          </div>
          
          <div className="fade-in" style={{ marginBottom: 20 }}>
            {activeTab === 'phishing' && (
              <>
                <div className="form-group">
                  <label className="form-label">Sender Email</label>
                  <input className="form-input" placeholder="e.g. ceo@evil.com" value={forms.phishing.sender} onChange={e => handleFormChange('phishing', 'sender', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" placeholder="e.g. URGENT WIRE TRANSFER" value={forms.phishing.subject} onChange={e => handleFormChange('phishing', 'subject', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Body Text</label>
                  <textarea className="form-textarea" placeholder="Paste full email body here..." value={forms.phishing.body_text} onChange={e => handleFormChange('phishing', 'body_text', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Extracted URLs (Comma Separated)</label>
                  <input className="form-input" placeholder="http://malicious.com" value={forms.phishing.urls} onChange={e => handleFormChange('phishing', 'urls', e.target.value)} />
                </div>
              </>
            )}

            {activeTab === 'bec' && (
              <>
                <div className="form-group">
                  <label className="form-label">Sender Email</label>
                  <input className="form-input" value={forms.bec.sender} onChange={e => handleFormChange('bec', 'sender', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reply-To Email</label>
                  <input className="form-input" placeholder="Mismatched reply address" value={forms.bec.reply_to} onChange={e => handleFormChange('bec', 'reply_to', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={forms.bec.subject} onChange={e => handleFormChange('bec', 'subject', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Body Text</label>
                  <textarea className="form-textarea" value={forms.bec.body_text} onChange={e => handleFormChange('bec', 'body_text', e.target.value)} />
                </div>
              </>
            )}

            {activeTab === 'wire' && (
              <>
                <div className="form-group">
                  <label className="form-label">Amount (USD)</label>
                  <input className="form-input" type="number" value={forms.wire.amount} onChange={e => handleFormChange('wire', 'amount', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sender Account</label>
                  <input className="form-input" value={forms.wire.sender_account} onChange={e => handleFormChange('wire', 'sender_account', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Recipient Account</label>
                  <input className="form-input" value={forms.wire.recipient_account} onChange={e => handleFormChange('wire', 'recipient_account', e.target.value)} />
                </div>
              </>
            )}

            {activeTab === 'otp' && (
              <>
                <div className="form-group">
                  <label className="form-label">User ID</label>
                  <input className="form-input" value={forms.otp.user_id} onChange={e => handleFormChange('otp', 'user_id', e.target.value)} />
                </div>
                <div className="grid2">
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input className="form-input" type="number" value={forms.otp.geo_lat} onChange={e => handleFormChange('otp', 'geo_lat', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input className="form-input" type="number" value={forms.otp.geo_lon} onChange={e => handleFormChange('otp', 'geo_lon', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'ato' && (
              <>
                <div className="form-group">
                  <label className="form-label">User ID (Target)</label>
                  <input className="form-input" value={forms.ato.user_id} onChange={e => handleFormChange('ato', 'user_id', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Login IP</label>
                  <input className="form-input" value={forms.ato.login_ip} onChange={e => handleFormChange('ato', 'login_ip', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Privilege Level (1-10)</label>
                  <input className="form-input" type="number" value={forms.ato.privilege_level} onChange={e => handleFormChange('ato', 'privilege_level', e.target.value)} />
                </div>
              </>
            )}
          </div>

          <button className="btn btn-primary" onClick={handleTest} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Analyzing...' : 'Run Diagnostics'}
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Analysis Result</h3>
          </div>
          {result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {result.error ? (
                <div className="badge badge-danger" style={{ padding: 12 }}>{result.error}</div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                   <div className="score-ring" style={{ width: 120, height: 120 }}>
                     <svg width="120" height="120" viewBox="0 0 120 120">
                       <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-card2)" strokeWidth="12" />
                       <circle cx="60" cy="60" r="54" fill="none" stroke={result.prediction || (result.threat_score && result.threat_score > 60) ? 'var(--danger)' : 'var(--success)'} strokeWidth="12" strokeDasharray={`${((result.confidence || (result.threat_score/100) || 0) * 100) * 3.39} 339`} />
                     </svg>
                     <div className="score-text">{Math.round((result.confidence || (result.threat_score/100) || 0) * 100)}%</div>
                     <div className="score-unit">Confidence</div>
                   </div>
                   <div style={{ marginTop: 12, fontWeight: 600, fontSize: 18, color: result.prediction || (result.threat_score && result.threat_score > 60) ? 'var(--danger)' : 'var(--success)' }}>
                     {result.prediction ? 'Threat Detected' : 'Safe/Benign'}
                   </div>
                 </div>

                 <div className="divider" />
                 
                 <div style={{ marginBottom: 16 }}>
                   <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700 }}>Triggered Indicators (Vectors)</div>
                   <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                     {(result.vectors || result.flags || []).map((vec, i) => (
                       <span key={i} className="badge badge-warning">{String(vec).replace('_', ' ')}</span>
                     ))}
                     {(!result.vectors && !result.flags) || (result.vectors?.length === 0 && result.flags?.length === 0) ? (
                       <span className="badge badge-success">No active flags.</span>
                     ) : null}
                   </div>
                 </div>

                 <div style={{ background: 'var(--bg-card2)', padding: 16, borderRadius: 8, fontSize: 13, borderLeft: `3px solid ${result.prediction ? 'var(--danger)' : 'var(--success)'}` }}>
                   <strong>System Reason: </strong> Calculated based on module heuristics and Natural Language Processing.
                   <br/><br/>
                   <span style={{ color: 'var(--text-muted)' }}>Analyzed Object ID: {result.id || 'N/A'}</span>
                 </div>
                </>
              )}
            </motion.div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🛡️</div>
              <p>Run detection to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
