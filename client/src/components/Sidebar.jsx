const navigation = [
  { label: 'Dashboard', view: 'dashboard', icon: 'grid' },
  { label: 'DSA Roadmap', view: 'roadmap', icon: 'map' },
  { label: 'Revision', view: 'revision', icon: 'refresh' },
  { label: 'Bookmarks', view: 'bookmarks', icon: 'bookmark' },
]

function NavigationIcon({ name }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    map: <><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15M15 6v15" /></>,
    refresh: <><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" /><path d="M3 21v-5h5" /><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8" /><path d="M21 3v5h-5" /></>,
    bookmark: <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">{paths[name]}</svg>
}

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 lg:inset-y-0 lg:right-auto lg:w-64 lg:border-r lg:border-t-0 lg:px-4 lg:py-6">
      <div className="hidden items-center gap-3 px-3 lg:flex">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-sm font-bold text-white">D</div>
        <span className="font-semibold tracking-tight">DSA Practice</span>
      </div>
      <nav className="flex justify-around lg:mt-10 lg:block lg:space-y-1" aria-label="Primary navigation">
        {navigation.map((item) => (
          <button key={item.label} type="button" onClick={() => onNavigate(item.view)} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:w-full ${activeView === item.view ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
            <NavigationIcon name={item.icon} />
            <span className="hidden sm:inline lg:inline">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
