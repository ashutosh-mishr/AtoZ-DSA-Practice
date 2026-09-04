import { useState } from 'react'

import { useAuth } from '../AuthContext'
import { api } from '../api'

function CodeMark({ small = false }) {
  return (
    <div className={`${small ? 'h-11 w-11 rounded-xl' : 'h-14 w-14 rounded-2xl'} grid place-items-center bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-lg shadow-violet-500/25`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={small ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden="true">
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="m8 10-2 2 2 2m8-4 2 2-2 2m-3-5-2 6" />
        <path d="M8 21h8" />
      </svg>
    </div>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" />
    </svg>
  )
}

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.1 0 8.5 4 9.5 6-.4.8-1.2 2.1-2.5 3.3" />
      <path d="M6.2 6.2C4.4 7.5 3.2 9.1 2.5 10c1 2 4.4 6 9.5 6 1 0 1.9-.2 2.8-.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6" aria-hidden="true">
      <path d="M5 20V12" />
      <path d="M12 20V7" />
      <path d="M19 20V4" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-6 w-6" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20c10 0 19.3-7.2 19.3-20 0-1.2-.1-2.3-.3-3.5Z" />
      <path fill="#FF3D00" d="M6.3 14.7 12.9 19.5C14.7 15 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10.1-2 13.6-5.2l-6.3-5.2C29.6 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.9 5.5-7.6 6.8l6.3 5.2C37.7 36.8 44 31 44 24c0-1.2-.1-2.3-.4-3.5Z" />
    </svg>
  )
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-[#0d0d0f] dark:text-white">
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-900/10" />
          <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-900/10" />
        </div>

        <main className="relative flex min-h-screen w-full">
          <div className="grid min-h-screen w-full overflow-hidden bg-white dark:bg-[#151515] lg:grid-cols-2">

            <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#312e81] via-violet-700 to-purple-600 px-[7vw] py-[5vh] text-white lg:flex lg:min-h-screen lg:flex-col">
              <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full border-[80px] border-white/5" />
              <div className="pointer-events-none absolute -bottom-32 left-24 h-72 w-72 rounded-full border-[70px] border-white/5" />

              <div className="relative translate-y-10">
                <CodeMark />

                <h1 className="mt-7 text-4xl font-bold tracking-tight xl:text-[3rem] xl:text-[3rem]">
                  DSA Practice
                </h1>

                <p className="mt-4 max-w-lg text-lg leading-8 xl:text-xl text-violet-100">
                  Build consistency. Improve skills.
                  <br />
                  Track your progress.
                </p>
              </div>

              <div className="relative mt-12 translate-y-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <ChartIcon />
                  </div>
                  <div>
                    <p className="font-semibold">Track Progress</p>
                    <p className="mt-1 text-sm text-violet-200">See your growth over time</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <ListIcon />
                  </div>
                  <div>
                    <p className="font-semibold">Practice DSA</p>
                    <p className="mt-1 text-sm text-violet-200">Solve problems, build skills</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <TargetIcon />
                  </div>
                  <div>
                    <p className="font-semibold">Stay Consistent</p>
                    <p className="mt-1 text-sm text-violet-200">Achieve your goals</p>
                  </div>
                </div>
              </div>

              <div className="relative mt-auto pt-10">
                <div className="h-px w-16 bg-white/30" />
                <p className="mt-6 max-w-sm text-lg italic leading-7 text-violet-100">
                  “A little progress each day adds up to big results.”
                </p>
                <p className="mt-3 text-sm text-violet-200">— Keep Going</p>
              </div>
            </section>

            <section className="flex min-h-screen flex-col px-[5.5vw] py-[3.5vh]">
              <div className="flex justify-between gap-4">
                <div className="lg:hidden">
                  <CodeMark small />
                </div>

                <p className="ml-auto text-sm text-slate-500 dark:text-slate-400">
                  {isLogin ? "New here?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate(isLogin ? 'register' : 'login')}
                    className="ml-1 cursor-pointer font-semibold text-violet-600 transition hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    {isLogin ? 'Register' : 'Login'}
                  </button>
                </p>
              </div>

              <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center py-6 lg:-translate-y-2">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {isLogin ? 'Welcome back' : 'Create your account'}
                  </h2>
                  <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
                    {isLogin
                      ? 'Sign in to continue your DSA journey.'
                      : 'Create your account and start your DSA journey.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {!isLogin && (
                    <label className="mb-5 block">
                      <span className="mb-2 block text-sm font-semibold">Name</span>
                      <div className="relative">
                        <UserIcon />
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          autoComplete="name"
                          placeholder="Your name"
                          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-[#383838] dark:bg-[#101010] dark:text-white dark:placeholder:text-slate-500"
                        />
                      </div>
                    </label>
                  )}

                  <label className="mb-5 block">
                    <span className="mb-2 block text-sm font-semibold">Email</span>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        <MailIcon />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-[#383838] dark:bg-[#101010] dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>
                  </label>

                  <label className="mb-5 block">
                    <span className="mb-2 block text-sm font-semibold">Password</span>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        <LockIcon />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-[#383838] dark:bg-[#101010] dark:text-white dark:placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon hidden={showPassword} />
                      </button>
                    </div>
                  </label>

                  {!isLogin && (
                    <label className="mb-5 block">
                      <span className="mb-2 block text-sm font-semibold">Confirm password</span>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                          <LockIcon />
                        </span>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-[#383838] dark:bg-[#101010] dark:text-white dark:placeholder:text-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <EyeIcon hidden={showConfirmPassword} />
                        </button>
                      </div>
                    </label>
                  )}

                  {error && (
                    <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                      {error}
                    </div>
                  )}

                  <button
                    disabled={submitting}
                    className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:from-violet-700 hover:to-purple-700 hover:shadow-violet-600/30 disabled:cursor-wait disabled:opacity-60"
                  >
                    {submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
                    <span className="text-lg transition-transform group-hover:translate-x-0.5">→</span>
                  </button>

                  <div className="my-7 flex items-center gap-4">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-[#303030]" />
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Or continue with</span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-[#303030]" />
                  </div>

                  <button
                    type="button"
                    onClick={() => api.startGoogleLogin()}
                    disabled={submitting}
                    className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-white dark:hover:border-[#505050] dark:hover:bg-[#1b1b1b]"
                  >
                    <GoogleIcon />
                    {isLogin ? 'Continue with Google' : 'Sign up with Google'}
                  </button>

                  <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
                    Secure sign-in. Your account and progress are protected.
                  </p>
                </form>
              </div>

              <div className="pt-4 text-center text-xs text-slate-400 dark:text-slate-600">
                © 2026 DSA Practice
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
