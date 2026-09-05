import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { api } from '../api'
import './AuthPage.css'

function CodeMark({ compact = false }) {
  return <div className={`auth-code-mark${compact ? ' auth-code-mark--compact' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="m8 10-2 2 2 2m8-4 2 2-2 2m-3-5-2 6" />
      <path d="M8 21h8" />
    </svg>
  </div>
}

function GoogleIcon() {
  return <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.21 2.91-7.42Z" />
    <path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.5Z" />
    <path fill="#FBBC05" d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.08.31-1.59V7.88H3.3A9.5 9.5 0 0 0 2.25 12c0 1.53.37 2.98 1.05 4.12l3.24-2.53Z" />
    <path fill="#EA4335" d="M12 6.38c1.43 0 2.7.49 3.71 1.46l2.78-2.78C16.83 3.48 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38Z" />
  </svg>
}

function EyeIcon({ hidden }) {
  return hidden ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 3l18 18" />
    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
    <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 8.73 4.11 9.75 6.5a11.72 11.72 0 0 1-3.04 4.03M6.61 6.61C4.63 7.91 3.21 9.67 2.25 12 3.27 14.39 7 18.5 12 18.5c1.31 0 2.54-.27 3.65-.72" />
  </svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.25 12S5.25 5.5 12 5.5 21.75 12 21.75 12 18.75 18.5 12 18.5 2.25 12 2.25 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
}

function FieldIcon({ type }) {
  if (type === 'email') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
}

function FeatureIcon({ type }) {
  if (type === 'progress') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 20v-5M12 20V9M19 20V4" /></svg>
  if (type === 'practice') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></svg>
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 4V2m0 20v-2m8-8h2M2 12h2" /></svg>
}

export default function AuthPage({ mode = 'login', onNavigate }) {
  const isLogin = mode === 'login'
  const { login, register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState(() => new URLSearchParams(window.location.search).get('error') || new URLSearchParams(window.location.search).get('google_error') || '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) return setError('Email and password are required.')
    if (!isLogin && !name.trim()) return setError('Name is required.')
    if (!isLogin && password !== confirmPassword) return setError('Passwords do not match.')
    setSubmitting(true)
    try {
      if (isLogin) await login(email, password)
      else await register(name, email, password)
      window.history.replaceState({}, '', '/dashboard')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const features = [
    ['progress', 'Track Progress', 'See your growth over time'],
    ['practice', 'Practice DSA', 'Solve problems, build skills'],
    ['target', 'Stay Consistent', 'Achieve your goals'],
  ]

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
            {features.map(([type, title, detail]) => <div className="auth-feature" key={title}>
              <div className="auth-feature-icon"><FeatureIcon type={type} /></div>
              <div><div className="auth-feature-title">{title}</div><div className="auth-feature-detail">{detail}</div></div>
            </div>)}
          </div>

          <div className="auth-quote">
            <p>“A little progress each day adds up to big results.”</p>
            <span>— Keep Going</span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-top-link">
          <span>{isLogin ? 'New here?' : 'Already have an account?'}</span>
          <button type="button" onClick={() => onNavigate(isLogin ? 'register' : 'login')}>
            {isLogin ? 'Register' : 'Login'}
          </button>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><CodeMark compact /></div>
          <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth-subtitle">{isLogin ? 'Sign in to continue your DSA journey.' : 'Start your DSA journey and track every step.'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && <label className="auth-field">
              <span className="auth-label">Name</span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5" /></svg></span>
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" />
              </span>
            </label>}

            <label className="auth-field">
              <span className="auth-label">Email</span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon"><FieldIcon type="email" /></span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" />
              </span>
            </label>

            {isLogin && <div className="auth-forgot-row"><button type="button" onClick={() => onNavigate('forgot-password')}>Forgot password?</button></div>}

            <label className="auth-field">
              <span className="auth-label">Password</span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon"><FieldIcon type="password" /></span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Enter your password" />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}><EyeIcon hidden={!showPassword} /></button>
              </span>
            </label>

            {!isLogin && <label className="auth-field">
              <span className="auth-label">Confirm password</span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon"><FieldIcon type="password" /></span>
                <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Re-enter your password" />
                <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}><EyeIcon hidden={!showConfirmPassword} /></button>
              </span>
            </label>}

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button disabled={submitting} className="auth-submit" type="submit">
              <span>{submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</span>
              {!submitting && <span className="auth-submit-arrow" aria-hidden="true">→</span>}
            </button>

            <div className="auth-divider"><span /><em>Or continue with</em><span /></div>

            <button type="button" onClick={() => api.startGoogleLogin()} disabled={submitting} className="auth-google-button">
              <GoogleIcon />
              <span>{isLogin ? 'Continue with Google' : 'Sign up with Google'}</span>
            </button>

            <div className="auth-security">
              <span className="auth-security-icon"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 20 5v5.7c0 5.2-3.4 9.3-8 10.8-4.6-1.5-8-5.6-8-10.8V5l8-2.5Zm3.5 7.1-4.3 4.3-2.1-2.1-1.1 1.1 3.2 3.2 5.4-5.4-1.1-1.1Z" /></svg></span>
              <span>Secure sign-in with your Google account</span>
            </div>
          </form>
        </div>
      </section>
    </div>
    <footer className="auth-footer">© 2026 DSA Practice</footer>
  </div>
}
