import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'

function LoadingState() {
  return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-[#303030] dark:bg-[#171717] dark:text-slate-400">Loading users…</div>
}

function ErrorState({ message, onRetry }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/30"><p className="font-medium text-rose-800 dark:text-rose-200">Unable to load users</p><p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{message}</p><button type="button" onClick={onRetry} className="mt-4 cursor-pointer rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">Try again</button></div>
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function Stat({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#303030] dark:bg-[#111111]"><p className="text-xs text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight">{value}</p></div>
}

export default function AdminPage({ currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [query, setQuery] = useState('')

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      setUsers(await api.getAdminUsers())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return users
    return users.filter((item) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(normalized))
  }, [users, query])

  const summary = useMemo(() => ({
    total: users.length,
    active: users.filter((item) => item.active).length,
    admins: users.filter((item) => item.role === 'admin').length,
    solved: users.reduce((sum, item) => sum + item.solved_count, 0),
  }), [users])

  async function toggleUser(item) {
    if (item.id === currentUser.id) return
    const action = item.active ? 'disable' : 'enable'
    if (!window.confirm(`Are you sure you want to ${action} ${item.name || item.email}?`)) return
    setBusyId(item.id)
    try {
      const updated = await api.updateAdminUserStatus(item.id, !item.active)
      setUsers((current) => current.map((user) => user.id === item.id ? { ...user, ...updated } : user))
    } catch (actionError) {
      window.alert(actionError.message)
    } finally {
      setBusyId(null)
    }
  }

  async function deleteUser(item) {
    if (item.id === currentUser.id) return
    const confirmed = window.confirm(`Delete ${item.name || item.email}? This permanently removes their progress, bookmarks, notes, and activity.`)
    if (!confirmed) return
    setBusyId(item.id)
    try {
      await api.deleteAdminUser(item.id)
      setUsers((current) => current.filter((user) => user.id !== item.id))
    } catch (actionError) {
      window.alert(actionError.message)
    } finally {
      setBusyId(null)
    }
  }

  return <>
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Admin</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Manage accounts and review practice activity.</p></div>
        <button type="button" onClick={loadUsers} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#3a3a3a] dark:bg-[#171717] dark:text-slate-200 dark:hover:bg-[#242424]">Refresh</button>
      </div>
    </div>

    {error ? <ErrorState message={error} onRetry={loadUsers} /> : loading ? <LoadingState /> : <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={summary.total} />
        <Stat label="Active users" value={summary.active} />
        <Stat label="Admins" value={summary.admins} />
        <Stat label="Solved across users" value={summary.solved} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#303030] dark:bg-[#171717]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-[#303030]">
          <div><h2 className="font-semibold">Registered users</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{filteredUsers.length} of {users.length} accounts</p></div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users…" className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-[#111111] dark:text-slate-400">
              <tr><th className="px-4 py-3 font-semibold">User</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Solved</th><th className="px-4 py-3 font-semibold">Revision</th><th className="px-4 py-3 font-semibold">Bookmarks</th><th className="px-4 py-3 font-semibold">Notes</th><th className="px-4 py-3 font-semibold">Active days</th><th className="px-4 py-3 font-semibold">Last active</th><th className="px-4 py-3 font-semibold">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#292929]">
              {filteredUsers.map((item) => {
                const isSelf = item.id === currentUser.id
                const busy = busyId === item.id
                return <tr key={item.id} className="align-middle hover:bg-slate-50/70 dark:hover:bg-[#1d1d1d]">
                  <td className="px-4 py-4"><p className="font-semibold">{item.name || 'Unnamed user'} {isSelf ? <span className="ml-1 text-xs font-medium text-violet-600 dark:text-violet-300">(you)</span> : null}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.email}</p><p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Joined {formatDate(item.created_at)}</p></td>
                  <td className="px-4 py-4"><span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">{item.role}</span></td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'}`}>{item.active ? 'Active' : 'Disabled'}</span></td>
                  <td className="px-4 py-4 font-semibold">{item.solved_count}</td>
                  <td className="px-4 py-4">{item.revision_count}</td>
                  <td className="px-4 py-4">{item.bookmark_count}</td>
                  <td className="px-4 py-4">{item.note_count}</td>
                  <td className="px-4 py-4">{item.active_days}</td>
                  <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{formatDate(item.last_active_date)}</td>
                  <td className="px-4 py-4"><div className="flex items-center gap-2">{isSelf ? <span className="text-xs text-slate-400 dark:text-slate-500">Current account</span> : <><button type="button" disabled={busy} onClick={() => toggleUser(item)} className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${item.active ? 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-950/30' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700/50 dark:text-emerald-300 dark:hover:bg-emerald-950/30'}`}>{item.active ? 'Disable' : 'Enable'}</button><button type="button" disabled={busy} onClick={() => deleteUser(item)} className="cursor-pointer rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-700/50 dark:text-rose-300 dark:hover:bg-rose-950/30">Delete</button></>}</div></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 ? <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No users match your search.</div> : null}
      </div>
    </>}
  </>
}
