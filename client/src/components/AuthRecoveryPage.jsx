import { useState } from 'react'
import { api } from '../api'
import './AuthPage.css'

function CodeMark() {
  return <div className="auth-code-mark" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="m8 10-2 2 2 2m8-4 2 2-2 2m-3-5-2 6" />
      <path d="M8 21h8" />
    </svg>
  </div>
}

function EyeIcon({ hidden }) {
  return hidden ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" /><path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 8.73 4.11 9.75 6.5a11.72 11.72 0 0 1-3.04 4.03M6.61 6.61C4.63 7.91 3.21 9.67 2.25 12 3.27 14.39 7 18.5 12 18.5c1.31 0 2.54-.27 3.65-.72" /></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.25 12S5.25 5.5 12 5.5 21.75 12 21.75 12 18.75 18.5 12 18.5 2.25 12 2.25 12Z" /><circle cx="12" cy="12" r="3" /></svg>
}

function FieldIcon({ type }) {
  if (type === 'email') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
}

export default function AuthRecoveryPage({ mode = 'forgot', onNavigate }) {
  const isReset = mode === 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const token = new URLSearchParams(window.location.search).get('token') || ''

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (isReset) {
      if (!token) return setError('This password reset link is missing its token. Please request a new one.')
      if (password.length < 8) return setError('Password must be at least 8 characters.')
      if (password !== confirmPassword) return setError('Passwords do not match.')
    } else if (!email.trim()) {
      return setError('Please enter your email address.')
    }

    setSubmitting(true)
    try {
      if (isReset) {
        await api.resetPassword(token, password)
        setSuccess(true)
      } else {
        await api.requestPasswordReset(email)
        setSuccess(true)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="auth-page">
    <div className="auth-shell">
      <section className="auth-hero" aria-label="DSA Practice overview">
        <div className="auth-hero-glow auth-hero-glow--one" />
        <div className="auth-hero-glow auth-hero-glow--two" />
        <div className="auth-hero-content">
          <CodeMark />
          <div className="auth-brand">DSA Practice</div>
          <p className="auth-tagline">Build consistency. Improve skills.<br />Track your progress.</p>
          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-icon">✓</div><div><div className="auth-feature-title">Stay Secure</div><div className="auth-feature-detail">Protect your account access</div></div></div>
            <div className="auth-feature"><div className="auth-feature-icon">↗</div><div><div className="auth-feature-title">Keep Learning</div><div className="auth-feature-detail">Get back to your DSA journey</div></div></div>
            <div className="auth-feature"><div className="auth-feature-icon">★</div><div><div className="auth-feature-title">Stay Consistent</div><div className="auth-feature-detail">Track every step of your progress</div></div></div>
          </div>
          <div className="auth-quote"><p>“A little progress each day adds up to big results.”</p><span>— Keep Going</span></div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-top-link"><span>Remember your password?</span><button type="button" onClick={() => onNavigate('login')}>Sign in</button></div>
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><CodeMark /></div>
          <h1>{isReset ? 'Set a new password' : 'Forgot your password?'}</h1>
          <p className="auth-subtitle">{isReset ? 'Choose a new password for your DSA Practice account.' : 'Enter your email and we’ll send you a secure reset link.'}</p>

          {success ? <div className="auth-success" role="status">
            <div className="auth-success-icon">✓</div>
            <div>
              <strong>{isReset ? 'Password reset complete' : 'Check your email'}</strong>
              <p>{isReset ? 'Your password has been changed. You can now sign in with your new password.' : 'If an account with that email exists, a password reset link has been sent. Check your inbox and spam folder.'}</p>
            </div>
            <button type="button" className="auth-submit auth-recovery-button" onClick={() => onNavigate('login')}>Back to sign in <span className="auth-submit-arrow">→</span></button>
          </div> : <form onSubmit={handleSubmit} className="auth-form">
            {!isReset ? <label className="auth-field"><span className="auth-label">Email</span><span className="auth-input-wrap"><span className="auth-input-icon"><FieldIcon type="email" /></span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></span></label> : <>
              <label className="auth-field"><span className="auth-label">New password</span><span className="auth-input-wrap"><span className="auth-input-icon"><FieldIcon type="password" /></span><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}><EyeIcon hidden={!showPassword} /></button></span></label>
              <label className="auth-field"><span className="auth-label">Confirm password</span><span className="auth-input-wrap"><span className="auth-input-icon"><FieldIcon type="password" /></span><input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Re-enter your password" /><button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}><EyeIcon hidden={!showConfirmPassword} /></button></span></label>
            </>}
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button disabled={submitting} className="auth-submit" type="submit"><span>{submitting ? 'Please wait…' : isReset ? 'Reset password' : 'Send reset link'}</span>{!submitting && <span className="auth-submit-arrow" aria-hidden="true">→</span>}</button>
            <button type="button" className="auth-back-link" onClick={() => onNavigate('login')}>← Back to sign in</button>
          </form>}
        </div>
      </section>
    </div>
    <footer className="auth-footer">© 2026 DSA Practice</footer>
  </div>
}
