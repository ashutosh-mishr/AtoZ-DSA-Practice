function Header({ isDark, onThemeToggle, onNavigate }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur dark:border-[#303030] dark:bg-[#111111]/90">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => onNavigate?.('dashboard')} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-1.5 py-1 font-semibold tracking-tight hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-[#242424] dark:hover:text-violet-300" title="Go to Dashboard" aria-label="Go to Dashboard">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-600 text-white shadow-sm shadow-violet-200 dark:shadow-none">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="m8 10-2 2 2 2m8-4 2 2-2 2m-3-5-2 6" /><path d="M8 21h8" /></svg>
          </span>
          <span>DSA Practice</span>
        </button>
        <button type="button" onClick={onThemeToggle} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-[#3a3a3a] dark:bg-[#171717] dark:text-slate-300 dark:hover:bg-[#242424]" aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
          {isDark ? <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg> : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6 8.5 8.5 0 1 0 20.4 15.3Z" /></svg>}
        </button>
      </div>
    </header>
  )
}

export default Header
