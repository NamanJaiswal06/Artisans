import { useState } from 'react'
import { detectPhishing } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function PhishingScannerPage() {
  const [emailText, setEmailText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleScan = async () => {
    if (!emailText.trim()) return toast.error('Please paste an email to scan')
    
    setLoading(true)
    setResult(null)
    
    try {
      // In a real scenario, you'd extract sender/subject/urls from the raw text.
      // For this simple scanner, we send the entire text as the body.
      const payload = {
        sender: 'unknown',
        subject: 'Email Scan',
        body_text: emailText,
        urls: [],
      }
      
      const { data } = await detectPhishing(payload)
      setResult(data)
      if (data.prediction || (data.threat_score && data.threat_score > 50)) {
        toast.error('Threat detected in this email!')
      } else {
        toast.success('Email appears safe.')
      }
    } catch {
      toast.error('Scan failed. Please check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 20 }}>
        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Check if an Email is Safe</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto' }}>
          Not sure if an email is a scam? Paste the content below and our AI engine will analyze linguistic patterns, urgency triggers, and malicious intent to let you know if it's safe or fraud.
        </p>
      </div>
      
      <div className="grid-main-side" style={{ gridTemplateColumns: 'minmax(0, 1fr) 400px' }}>
        
        {/* Input Area */}
        <div className="card" style={{ padding: 32 }}>
          <label style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
             Paste Email Content
          </label>
          <textarea
            className="form-textarea"
            style={{ height: 350, fontSize: 15, padding: 20, fontFamily: 'var(--font)', lineHeight: 1.6 }}
            placeholder="Dear user,&#10;&#10;Your account will be strictly suspended within 24 hours unless you update your billing details immediately using the secure link below.&#10;&#10;Regards,&#10;Security Team"
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
          />
          <button 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginTop: 24, padding: 18, fontSize: 16 }} 
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? '🔍 Scanning contents using AI...' : '🔍 Scan Email Now'}
          </button>
        </div>

        {/* Results Area */}
        <AnimatePresence mode="popLayout">
          {result ? (
            <motion.div 
               initial={{ opacity: 0, x: 20 }} 
               animate={{ opacity: 1, x: 0 }} 
               exit={{ opacity: 0, scale: 0.95 }}
               className="card" 
               style={{ 
                 background: result.prediction ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                 borderColor: result.prediction ? 'var(--danger)' : 'var(--success)'
               }}
            >
               <div style={{ textAlign: 'center', padding: '20px 0' }}>
                 <div style={{ fontSize: 72, marginBottom: 12 }}>
                   {result.prediction ? '⚠️' : '✅'}
                 </div>
                 <h2 style={{ color: result.prediction ? 'var(--danger)' : 'var(--success)' }}>
                   {result.prediction ? 'Fraudulent Email' : 'Looks Safe!'}
                 </h2>
                 <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>
                   Our AI is <strong>{Math.round((result.confidence || result.threat_score/100 || 0) * 100)}% confident</strong> in this result.
                 </p>
               </div>
               
               <div className="divider" style={{ borderColor: 'var(--border-subtle)' }} />

               {result.prediction ? (
                 <div style={{ marginTop: 20 }}>
                   <h4 style={{ marginBottom: 12, color: 'var(--danger)' }}>Why is it dangerous?</h4>
                   <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                     {result.vectors?.map((vec, i) => (
                       <li key={i}><strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{String(vec).replace('_', ' ')}</strong> - The AI detected manipulated language corresponding to this common scam tactic.</li>
                     ))}
                     {(!result.vectors || result.vectors.length === 0) && (
                       <li>The grammatical structure heavily matches known fraudulent templates.</li>
                     )}
                   </ul>
                   <div style={{ marginTop: 20, padding: 16, background: 'var(--danger)', borderRadius: 8, color: 'white', fontSize: 14 }}>
                      <strong>Action Required:</strong> Do not click on any links inside this email, and do not reply or download any attachments.
                   </div>
                 </div>
               ) : (
                 <div style={{ marginTop: 20, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                   No immediate signs of urgency, manipulation, or known malicious intent were detected. However, always verify the sender's actual email address before sending sensitive data.
                 </div>
               )}
            </motion.div>
          ) : (
             <div className="card empty-state" style={{ height: '100%' }}>
               <div className="empty-state-icon" style={{ opacity: 0.1, fontSize: 64 }}>✉️</div>
               <p style={{ marginTop: 16, maxWidth: 220 }}>Paste an email and run the scanner to reveal hidden threats.</p>
             </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
