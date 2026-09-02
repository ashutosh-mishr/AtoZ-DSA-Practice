function StatIcon({ name }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    refresh: <><path d="M20 11a8 8 0 1 1-2.3-5.7" /><path d="M20 4v7h-7" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">{paths[name]}</svg>
}

const tones = { emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', blue: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400', slate: 'bg-slate-100 text-slate-600 dark:bg-[#242424] dark:text-slate-300' }

function StatCard({ label, value, detail, icon, tone }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#303030] dark:bg-[#171717]">
      <div className="flex items-start justify-between gap-4"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}><StatIcon name={icon} /></span></div>
      <p className="mt-5 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  )
}

export default StatCard
