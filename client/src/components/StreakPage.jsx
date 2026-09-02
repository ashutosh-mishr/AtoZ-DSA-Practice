import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'

function localDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA').format(date)
}

function formatDay(date) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

function StreakPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try { setData(await api.getStreaks(localDateKey())) }
    catch (requestError) { setError(requestError.message || 'Unable to load streak data.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const calendar = useMemo(() => {
    const activity = new Map((data?.activity || []).map((item) => [item.date, item.problems_solved]))
    const end = new Date(`${localDateKey()}T00:00:00`)
    const start = new Date(end)
    start.setDate(start.getDate() - 364)
    start.setDate(start.getDate() - start.getDay())
    const days = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const key = localDateKey(cursor)
      days.push({ date: key, count: activity.get(key) || 0, label: formatDay(cursor), month: cursor.getMonth(), year: cursor.getFullYear() })
      cursor.setDate(cursor.getDate() + 1)
    }
    return days
  }, [data])

  const weeks = []
  for (let i = 0; i < calendar.length; i += 7) weeks.push(calendar.slice(i, i + 7))

  const monthLabels = weeks.map((week, index) => {
    const first = week[0]
    const previous = index > 0 ? weeks[index - 1][0] : null
    const changed = !previous || first.month !== previous.month || first.year !== previous.year
    return changed ? new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(first.year, first.month, 1)) : ''
  })

  const maxCount = Math.max(1, ...calendar.map((day) => day.count))
  const level = (count) => count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4))

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading your streak…</div>
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30"><p className="font-medium text-rose-800 dark:text-rose-200">Unable to load streak</p><p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{error}</p><button type="button" onClick={load} className="mt-4 rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white">Try again</button></div>

  return <>
    <div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Build your daily solving habit</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Solve at least one problem in a day to make that day active and keep your streak alive.</p></div>
    <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ['Current streak', `${data.current_streak} ${data.current_streak === 1 ? 'day' : 'days'}`, '🔥'],
        ['Longest streak', `${data.longest_streak} ${data.longest_streak === 1 ? 'day' : 'days'}`, '🏆'],
        ['Active days', data.active_days, '✓'],
        ['Problems solved', data.problems_solved, '↗'],
      ].map(([label, value, icon]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><span className="text-base text-violet-500" aria-hidden="true">{icon}</span></div><p className="mt-4 text-2xl font-semibold">{value}</p></article>)}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">Your activity</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A day is active when you solve at least one problem.</p></div><p className="text-xs text-slate-400 dark:text-slate-500">Last 12 months</p></div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          <div className="mb-2 ml-8 overflow-hidden">
            <div className="grid text-[10px] text-slate-400" style={{ gridTemplateColumns: `repeat(${weeks.length}, 14px)`, columnGap: '4px' }}>
              {monthLabels.map((label, index) => <span key={`${label}-${index}`} className="whitespace-nowrap">{label}</span>)}
            </div>
          </div>
          <div className="flex gap-1">
            <div className="grid w-7 shrink-0 grid-rows-7 gap-1 text-[10px] text-slate-400"><span>Sun</span><span></span><span>Tue</span><span></span><span>Thu</span><span></span><span>Sat</span></div>
            <div className="grid grid-flow-col grid-rows-7 gap-1">{weeks.flat().map((day) => <div key={day.date} title={`${day.label}: ${day.count} solved`} aria-label={`${day.label}: ${day.count} solved`} className={`h-3.5 w-3.5 rounded-sm border border-slate-200 dark:border-slate-700 ${day.count === 0 ? 'bg-slate-100 dark:bg-slate-800' : level(day.count) === 1 ? 'bg-violet-200 dark:bg-violet-950' : level(day.count) === 2 ? 'bg-violet-400 dark:bg-violet-800' : level(day.count) === 3 ? 'bg-violet-500 dark:bg-violet-600' : 'bg-violet-700 dark:bg-violet-500'}`} />)}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-400"><span>Less</span>{[0,1,2,3,4].map((item) => <span key={item} className={`h-3.5 w-3.5 rounded-sm border border-slate-200 dark:border-slate-700 ${item === 0 ? 'bg-slate-100 dark:bg-slate-800' : item === 1 ? 'bg-violet-200 dark:bg-violet-950' : item === 2 ? 'bg-violet-400 dark:bg-violet-800' : item === 3 ? 'bg-violet-500 dark:bg-violet-600' : 'bg-violet-700 dark:bg-violet-500'}`} />)}<span>More</span></div>
    </section>
  </>
}

export default StreakPage
