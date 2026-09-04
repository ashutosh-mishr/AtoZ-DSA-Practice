import { useEffect, useState } from 'react'

const navigation = [
  { label: 'Dashboard', view: 'dashboard', icon: 'grid' },
  { label: 'DSA Roadmap', view: 'roadmap', icon: 'map' },
  { label: 'Streak', view: 'streaks', icon: 'flame' },
  { label: 'Practice', view: 'practice', icon: 'play' },
  { label: 'Bookmark', view: 'bookmarks', icon: 'bookmark' },
  { label: 'Revision', view: 'revision', icon: 'refresh' },
]

function NavigationIcon({ name }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    map: <><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15M15 6v15" /></>,
    refresh: <><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" /><path d="M3 21v-5h5" /><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8" /><path d="M21 3v5h-5" /></>,
    bookmark: <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6 8.5 8.5 0 1 0 20.4 15.3Z" />,
    play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4Z" /></>,
    flame: <path d="M12 22c4.4 0 7-3.1 7-7.2 0-3.2-1.7-5.4-4.2-7.6.1 2.3-.7 3.7-1.8 4.5.1-3.2-1.6-6-4.3-8.7.1 3.5-2.7 5.6-2.7 9.1C6 18.7 8.6 22 12 22Z" />,
    code: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="m8 10-2 2 2 2m8-4 2 2-2 2m-3-5-2 6" /><path d="M8 21h8" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="M6 6l12 12M18 6 6 18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">{paths[name]}</svg>
}

function Sidebar({ activeView, onNavigate, isDark, onThemeToggle, user, onLogout, onAccount }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return undefined
    const onKeyDown = (event) => { if (event.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  function navigate(view) {
    onNavigate(view)
    setMobileOpen(false)
  }

  const navigationContent = <>
    <div className="flex items-center gap-2 px-3">
      <button type="button" onClick={() => navigate('dashboard')} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl py-1 text-left hover:bg-slate-50 dark:hover:bg-[#242424]" title="Go to Dashboard" aria-label="Go to Dashboard">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-200 dark:shadow-none"><NavigationIcon name="code" /></div>
        <span className="font-semibold tracking-tight">DSA Practice</span>
      </button>
      <div className="group relative shrink-0"><button type="button" onClick={onThemeToggle} className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#242424] dark:hover:text-white" aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}><NavigationIcon name={isDark ? 'sun' : 'moon'} /></button><span className="pointer-events-none absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-slate-900">{`Switch to ${isDark ? 'light' : 'dark'} mode`}</span></div>
      <button type="button" onClick={() => setMobileOpen(false)} className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#242424] lg:hidden" aria-label="Close navigation menu"><NavigationIcon name="close" /></button>
    </div>

    <nav className="mt-8 space-y-1" aria-label="Primary navigation">
      {navigation.map((item) => (
        <button key={item.label} type="button" onClick={() => navigate(item.view)} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${activeView === item.view ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#242424] dark:hover:text-white'}`}>
          <NavigationIcon name={item.icon} /><span>{item.label}</span>
        </button>
      ))}
      {user?.role === 'admin' ? <button type="button" onClick={() => navigate('admin')} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${activeView === 'admin' ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#242424] dark:hover:text-white'}`}>
        <NavigationIcon name="users" /><span>Admin</span>
      </button> : null}
    </nav>

    <div className="mt-auto pt-8">
      {user ? <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5 dark:border-[#303030] dark:bg-[#171717]">
        <button type="button" onClick={onAccount} className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-white dark:hover:bg-[#242424]" title="Account Settings">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-700 dark:text-violet-300">{(user.name || user.email || '?').slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name || user.email}</p><p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p></div>
          <span className="shrink-0 text-slate-400 dark:text-slate-500">⚙</span>
        </button>
        <button type="button" onClick={onLogout} className="mt-2 w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white dark:border-[#3a3a3a] dark:text-slate-300 dark:hover:bg-[#242424]">Log out</button>
      </div> : null}
    </div>
  </>

  return <>
    <button type="button" onClick={() => setMobileOpen(true)} className="absolute left-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg dark:border-[#2a2a2a] dark:bg-[#1b1b1b] dark:text-slate-200 lg:hidden" aria-label="Open navigation menu"><NavigationIcon name="menu" /></button>
    {mobileOpen ? <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden" /> : null}
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white px-4 py-6 shadow-2xl transition-transform duration-200 dark:border-[#2a2a2a] dark:bg-[#1b1b1b] lg:inset-y-0 lg:right-auto lg:z-20 lg:w-64 lg:translate-x-0 lg:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-full flex-col">{navigationContent}</div>
    </aside>
  </>
}

export default Sidebar
