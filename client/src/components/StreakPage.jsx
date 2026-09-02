import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'

function localDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA').format(date)
}

function formatDay(date) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function StreakPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const currentYear = new Date().getFullYear()
  const firstYear = 2026
  const [selectedYear, setSelectedYear] = useState(Math.max(firstYear, currentYear))

  async function load() {
    setLoading(true); setError('')
    try { setData(await api.getStreaks(localDateKey())) }
    catch (requestError) { setError(requestError.message || 'Unable to load streak data.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const activity = useMemo(() => new Map((data?.activity || []).map((item) => [item.date, Number(item.problems_solved)])), [data])

  const months = useMemo(() => Array.from({ length: 12 }, (_, monthIndex) => {
    const first = new Date(selectedYear, monthIndex, 1)
    const last = new Date(selectedYear, monthIndex + 1, 0)
    const leading = first.getDay()
    const totalDays = last.getDate()
    const cells = Array.from({ length: leading + totalDays }, (_, index) => {
      if (index < leading) return null
      const date = new Date(selectedYear, monthIndex, index - leading + 1)
      const key = localDateKey(date)
      const isFuture = date > new Date(`${localDateKey()}T00:00:00`)
      return { date: key, count: activity.get(key) || 0, label: formatDay(date), future: isFuture }
    })
    const weekCount = Math.ceil(cells.length / 7)
    while (cells.length < weekCount * 7) cells.push(null)
    return { label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(first), cells, weekCount }
  }), [activity, selectedYear])

  const yearStats = useMemo(() => {
    const days = months.flatMap((month) => month.cells).filter(Boolean)
    const valid = days.filter((day) => !day.future)
    return {
      problems: valid.reduce((sum, day) => sum + day.count, 0),
      activeDays: valid.filter((day) => day.count > 0).length,
    }
  }, [months])

  const maxCount = Math.max(1, ...months.flatMap((month) => month.cells).filter(Boolean).map((day) => day.count))
  const level = (count) => count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4))
  const levelClasses = [
    'bg-slate-100 dark:bg-[#242424]',
    'bg-emerald-200 dark:bg-emerald-950',
    'bg-emerald-400 dark:bg-emerald-800',
    'bg-emerald-500 dark:bg-emerald-600',
    'bg-emerald-700 dark:bg-emerald-500',
  ]
  const years = Array.from({ length: 5 }, (_, index) => firstYear + index)

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-[#303030] dark:bg-[#171717] dark:text-slate-400">Loading your streak…</div>
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30"><p className="font-medium text-rose-800 dark:text-rose-200">Unable to load streak</p><p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{error}</p><button type="button" onClick={load} className="mt-4 rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white">Try again</button></div>

  return <>
    <div className="mb-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Build your daily solving habit</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Solve at least one problem in a day to make that day active and keep your streak alive.</p>
    </div>

    <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Streak summary">
      {[
        ['Current Streak', `${data.current_streak} ${data.current_streak === 1 ? 'day' : 'days'}`, '🔥'],
        ['Longest Streak', `${data.longest_streak} ${data.longest_streak === 1 ? 'day' : 'days'}`, '🏆'],
        ['Active Days', data.active_days, '✓'],
        ['Problems solved', data.problems_solved, '↗'],
      ].map(([label, value, icon]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#303030] dark:bg-[#171717]"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><span className="text-base text-violet-500" aria-hidden="true">{icon}</span></div><p className="mt-4 text-2xl font-semibold">{value}</p></article>)}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#303030] dark:bg-[#171717] sm:p-6" aria-label="Yearly activity heatmap">
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xl text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-950 dark:text-white">{yearStats.problems}</span> problems solved in {selectedYear}</p>
          <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-400 dark:border-[#4a4a4a]" title="Each square represents one calendar day. Darker squares mean more problems solved.">i</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span>Total active days: <strong className="font-semibold text-slate-700 dark:text-slate-200">{yearStats.activeDays}</strong></span>
          <span>Max streak: <strong className="font-semibold text-slate-700 dark:text-slate-200">{data.longest_streak}</strong></span>
          <select aria-label="Activity year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 font-medium text-slate-700 outline-none dark:border-[#3a3a3a] dark:bg-[#242424] dark:text-slate-200">
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-4">
          {months.map((month) => <div key={`${selectedYear}-${month.label}`} className="shrink-0">
            <p className="mb-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">{month.label}</p>
            <div className="grid grid-flow-col grid-rows-7 auto-cols-[14px] gap-1" aria-label={`${month.label} ${selectedYear}`}>
              {month.cells.map((day, index) => day ? <div key={day.date} title={`${day.label}: ${day.count} ${day.count === 1 ? 'problem' : 'problems'} solved`} aria-label={`${day.label}: ${day.count} ${day.count === 1 ? 'problem' : 'problems'} solved`} className={`h-3.5 w-3.5 rounded-[3px] border border-slate-200 dark:border-[#3a3a3a] ${day.future ? 'opacity-35' : ''} ${levelClasses[level(day.count)]}`} /> : <div key={`empty-${selectedYear}-${month.label}-${index}`} className="h-3.5 w-3.5" aria-hidden="true" />)}
            </div>
          </div>)}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2 text-xs text-slate-400 dark:text-slate-500"><span>Less</span>{levelClasses.map((className, index) => <span key={index} className={`h-3.5 w-3.5 rounded-[3px] border border-slate-200 dark:border-[#3a3a3a] ${className}`} />)}<span>More</span></div>
    </section>
  </>
}

export default StreakPage
