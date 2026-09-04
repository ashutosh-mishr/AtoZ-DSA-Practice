import { useEffect, useState } from 'react'
import { api } from '../api'

function CloseIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
}

export default function AccountModal({ user, onClose, onUserUpdated, onLogout }) {
  const [name, setName] = useState(user?.name || '')
  const [welcomeMessage, setWelcomeMessage] = useState(user?.welcome_message || 'Welcome back')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [connectingGoogle, setConnectingGoogle] = useState(false)

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function saveProfile(event) {
    event.preventDefault()
    setSavingProfile(true); setError(''); setMessage('')
    try {
      const updated = await api.updateProfile({ name, welcome_message: welcomeMessage })
      onUserUpdated(updated)
      setName(updated.name || '')
      setWelcomeMessage(updated.welcome_message || 'Welcome back')
      setMessage('Profile updated successfully.')
    } catch (saveError) { setError(saveError.message) } finally { setSavingProfile(false) }
  }

  async function changePassword(event) {
    event.preventDefault()
    setSavingPassword(true); setError(''); setMessage('')
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); setSavingPassword(false); return }
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); setSavingPassword(false); return }
    try {
      await api.changePassword(currentPassword, newPassword)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setMessage('Password changed successfully.')
    } catch (saveError) { setError(saveError.message) } finally { setSavingPassword(false) }
  }

  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="account-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#303030] dark:bg-[#171717]">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-[#303030] dark:bg-[#171717]">
        <div><h2 id="account-title" className="text-lg font-semibold">Account Settings</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage your profile and password.</p></div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#242424]" aria-label="Close account settings"><CloseIcon /></button>
      </div>

      <div className="space-y-6 p-5">
        <section>
          <div className="mb-4 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-violet-500/10 text-lg font-bold text-violet-700 dark:text-violet-300">{(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold">{user?.name || 'Unnamed user'}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p></div></div>
          <form onSubmit={saveProfile} className="space-y-4">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Email</span><input value={user?.email || ''} disabled className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-500" /><p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">Email changes will be added with verification and Google account linking.</p></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Welcome message</span><input value={welcomeMessage} onChange={(event) => setWelcomeMessage(event.target.value)} maxLength={255} placeholder="Welcome back" className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100" /></label>
            <button type="submit" disabled={savingProfile} className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{savingProfile ? 'Saving…' : 'Save Profile'}</button>
          </form>
        </section>

        <section className="border-t border-slate-200 pt-6 dark:border-[#303030]">
          <h3 className="font-semibold">Google Account</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use Google to sign in to this same DSA Practice account.</p>
          <button type="button" onClick={() => { setConnectingGoogle(true); api.startGoogleLogin('link') }} disabled={user?.google_linked || connectingGoogle} className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-200 dark:hover:bg-[#242424]"><span className="font-bold">G</span>{user?.google_linked ? 'Google connected' : connectingGoogle ? 'Connecting…' : 'Connect Google'}</button>
        </section>

        <section className="border-t border-slate-200 pt-6 dark:border-[#303030]">
          <h3 className="font-semibold">{user?.password_set ? 'Change Password' : 'Set Password'}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user?.password_set ? 'Use your current password to set a new one.' : 'Add a password so you can also sign in with email and password.'}</p>
          <form onSubmit={changePassword} className="mt-4 space-y-4">
            {user?.password_set ? <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Current password</span><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100" /></label> : null}
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">New password</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Confirm new password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100" /></label>
            <button type="submit" disabled={savingPassword} className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-200 dark:hover:bg-[#242424]">{savingPassword ? (user?.password_set ? 'Changing…' : 'Setting…') : (user?.password_set ? 'Change Password' : 'Set Password')}</button>
          </form>
        </section>

        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</div> : null}
        {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</div> : null}

        <div className="border-t border-slate-200 pt-5 dark:border-[#303030]"><button type="button" onClick={onLogout} className="w-full cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#3a3a3a] dark:text-slate-200 dark:hover:bg-[#242424]">Log out</button></div>
      </div>
    </div>
  </div>
}
