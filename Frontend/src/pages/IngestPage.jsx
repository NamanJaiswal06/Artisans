import { useState } from 'react'
import { ingestFalconEvent } from '../services/api'
import toast from 'react-hot-toast'

export default function IngestPage() {
  const [input, setInput] = useState('{\n  "metadata": { "version": "1.0" },\n  "event": {\n    "EventSimpleName": "ProcessRollup2",\n    "DetectName": "Suspicious PowerShell",\n    "ComputerName": "WORKSTATION-01"\n  }\n}')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleIngest = async () => {
    try {
      setLoading(true)
      const { data } = await ingestFalconEvent(JSON.parse(input))
      setResult(data)
      toast.success('Event ingested and dispatched')
    } catch {
      toast.error('Ingestion failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <h2>Log Data Ingest</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Push external telemetry straight into the NARIP event broker.</p>
      
      <div className="card" style={{ maxWidth: 600 }}>
        <h4>CrowdStrike Falcon Event</h4>
        <textarea
          className="form-textarea"
          style={{ height: 250, marginTop: 16 }}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={handleIngest} disabled={loading}>
          {loading ? 'Sending...' : 'Send to Pipeline'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 600, marginTop: 24 }}>
        <h4>Ingestion Response</h4>
        <div className="divider" style={{ margin: '12px 0' }} />
        {result ? (
          <div className="result-box" style={{ marginTop: 16 }}>
            {JSON.stringify(result, null, 2)}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ opacity: 0.2 }}>📥</div>
            <p>Awaiting payload submission</p>
          </div>
        )}
      </div>
    </div>
  )
}
