import { useState } from 'react'
import { storeThreat } from '../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function ProfileStorePage() {
  const [form, setForm] = useState({
    input_text: 'Please wire $50,000 urgently to my direct offshore account.',
    prediction: 'Phishing',
    confidence: '0.97',
    vectors: 'urgency, wire_transfer, offshore',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleStore = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        input_text: form.input_text,
        prediction: form.prediction,
        confidence: Number(form.confidence),
        vectors: form.vectors.split(',').map(s => s.trim()),
        timeStamp: new Date().toISOString()
      }
      const { data } = await storeThreat(payload)
      setResult(data)
      toast.success('Successfully archived context to database')
    } catch {
      toast.error('Failed to store threat entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <h2>Global Threat Repository</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Manually log parsed vectors into the MongoDB Threat Analytics Collection.</p>
      
      <div className="grid-main-side">
        <div className="card">
          <form onSubmit={handleStore}>
            <div className="form-group">
              <label className="form-label">Intercepted Context (Raw Text)</label>
              <textarea className="form-textarea" name="input_text" value={form.input_text} onChange={handleChange} />
            </div>
            <div className="grid2">
              <div className="form-group">
                <label className="form-label">Taxonomy Classification</label>
                <input className="form-input" name="prediction" value={form.prediction} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Confidence Interval (0-1)</label>
                <input className="form-input" type="number" step="0.01" min="0" max="1" name="confidence" value={form.confidence} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
               <label className="form-label">Key Vectors (Comma separated)</label>
               <input className="form-input" name="vectors" value={form.vectors} onChange={handleChange} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={loading}>
              {loading ? 'Archiving...' : '📥 Store Threat Intelligence'}
            </button>
          </form>
        </div>
        
        <div className="card">
          <h4>Database Acknowledgment</h4>
          <div className="divider" style={{ margin: '12px 0' }} />
          {result ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                 <div className="status-dot" style={{ width: 14, height: 14, animation: 'none' }}></div>
                 <h4 style={{ color: 'var(--success)', margin: 0 }}>Storage Successful</h4>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: '2.4' }}>
                <li><strong>Document ID:</strong> <span className="badge badge-neutral">{result.threat?._id || result._id || 'Stored'}</span></li>
                <li><strong>Classification:</strong> {form.prediction}</li>
                <li><strong>Confidence Logged:</strong> {(Number(form.confidence) * 100).toFixed(1)}%</li>
                <li><strong>Vector Count:</strong> {form.vectors.split(',').length} extracted</li>
                <li><strong style={{ display: 'block', marginTop: 8 }}>Raw Signature:</strong> <span style={{ background: 'var(--bg-base)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--mono)', border: '1px solid var(--border)' }}>{form.input_text.substring(0, 30)}...</span></li>
              </ul>
            </motion.div>
          ) : (
            <div className="empty-state">
               <div className="empty-state-icon" style={{ opacity: 0.2 }}>🗄️</div>
               <p>Awaiting payload submission</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
