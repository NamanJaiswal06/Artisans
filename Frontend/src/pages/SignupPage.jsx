import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sendOtp, signup } from '../services/api'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [step, setStep] = useState(1) // 1=email+otp, 2=details
  const [form, setForm] = useState({
    email: '', otp: '', firstName: '', lastName: '',
    password: '', confirmPassword: '', role: 'security',
  })
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSendOtp = async () => {
    if (!form.email) return toast.error('Email is required')
    setSending(true)
    try {
      const { data } = await sendOtp(form.email)
      if (data.success) {
        toast.success('OTP sent! Check your inbox.')
        setStep(2)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP')
    } finally {
      setSending(false)
    }
  }

  const handleSignup = async e => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const { data } = await signup(form)
      if (data.success) {
        toast.success('Account created! Please log in.')
        navigate('/login')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">🛡️</div>
          <div>
            <h1 className="auth-title glow-text">Create Account</h1>
            <p className="auth-subtitle">Join the NARIP security platform</p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: step >= s ? 'var(--accent)' : 'var(--bg-card2)',
              transition: 'background 0.4s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <div className="slide-in">
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input
                id="signup-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <button
              id="send-otp-btn"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={handleSendOtp}
              disabled={sending}
            >
              {sending ? '⏳ Sending OTP…' : '📧 Send OTP →'}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSignup} className="slide-in">
            <div className="form-group">
              <label className="form-label">One-Time Password</label>
              <input id="signup-otp" className="form-input" name="otp" placeholder="6-digit OTP" value={form.otp} onChange={handleChange} />
            </div>
            <div className="grid2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input id="signup-firstname" className="form-input" name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input id="signup-lastname" className="form-input" name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select id="signup-role" className="form-select" name="role" value={form.role} onChange={handleChange}>
                <option value="security">Security</option>
                <option value="admin">Admin</option>
                <option value="finance">Finance</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input id="signup-password" className="form-input" type="password" name="password" placeholder="Min 8 chars" value={form.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input id="signup-confirm" className="form-input" type="password" name="confirmPassword" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} />
            </div>
            <button id="signup-btn" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }} type="submit" disabled={loading}>
              {loading ? '⏳ Creating account…' : '✅ Create Account'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => setStep(1)}>
              ← Back
            </button>
          </form>
        )}

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
