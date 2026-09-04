import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { api } from '../api'

function CodeMark() {
  return <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-white shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="m8 10-2 2 2 2m8-4 2 2-2 2m-3-5-2 6" /><path d="M8 21h8" /></svg></div>
}

export default function AuthPage({ mode = 'login', onNavigate }) {
  const isLogin = mode === 'login'
  const { login, register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(() => new URLSearchParams(window.location.search).get('error') || '')
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

  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#101010] dark:text-slate-100">
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center"><CodeMark /></div>
        <h1 className="text-2xl font-semibold tracking-tight">DSA Practice</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{isLogin ? 'Sign in to continue your practice.' : 'Create your account to start practicing.'}</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#303030] dark:bg-[#171717]">
        {!isLogin && <label className="mb-4 block"><span className="mb-2 block text-sm font-medium">Name</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-white" /></label>}
        <label className="mb-4 block"><span className="mb-2 block text-sm font-medium">Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-white" /></label>
        <label className="mb-4 block"><span className="mb-2 block text-sm font-medium">Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-white" /></label>
        {!isLogin && <label className="mb-4 block"><span className="mb-2 block text-sm font-medium">Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-white" /></label>}
        {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
        <button disabled={submitting} className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Please wait…' : isLogin ? 'Login' : 'Create account'}</button>
        <div className="my-5 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500"><span className="h-px flex-1 bg-slate-200 dark:bg-[#303030]" /><span>or</span><span className="h-px flex-1 bg-slate-200 dark:bg-[#303030]" /></div>
        <button type="button" onClick={() => api.startGoogleLogin()} disabled={submitting} className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100 dark:hover:bg-[#1d1d1d]"><span className="grid h-5 w-5 place-items-center text-base font-bold">G</span>{isLogin ? 'Continue with Google' : 'Sign up with Google'}</button>
        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">{isLogin ? <>Don't have an account? <button type="button" onClick={() => onNavigate('register')} className="cursor-pointer font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300">Register</button></> : <>Already have an account? <button type="button" onClick={() => onNavigate('login')} className="cursor-pointer font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300">Login</button></>}</p>
      </form>
    </div>
  </div>
}
