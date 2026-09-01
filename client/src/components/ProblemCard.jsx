import { useEffect, useState } from 'react'

const difficultyStyles = {
  easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  hard: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
}

function ProblemCard({ problem, onStatusChange, onBookmarkChange }) {
  const [bookmarked, setBookmarked] = useState(Boolean(problem.bookmarked))
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => { setBookmarked(Boolean(problem.bookmarked)) }, [problem.bookmarked])

  async function handleStatusChange(event) {
    setIsUpdating(true)
    try { await onStatusChange(problem.id, event.target.value) } finally { setIsUpdating(false) }
  }

  async function handleBookmarkChange() {
    setIsUpdating(true)
    try {
      await onBookmarkChange(problem.id, bookmarked)
      setBookmarked((current) => !current)
    } finally { setIsUpdating(false) }
  }

  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{problem.title}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{problem.topic.name} <span aria-hidden="true">/</span> {problem.subtopic.name}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${difficultyStyles[problem.difficulty]}`}>{problem.difficulty}</span></div>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">Status<select value={problem.status} onChange={handleStatusChange} disabled={isUpdating} aria-label={`Change status for ${problem.title}`} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><option value="not_started">Not Started</option><option value="solved">Solved</option><option value="revision">Revision</option></select></label><div className="flex items-center gap-2"><button type="button" onClick={handleBookmarkChange} disabled={isUpdating} className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">{bookmarked ? 'Unbookmark' : 'Bookmark'}</button><a href={problem.leetcode_url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">Solve on LeetCode</a></div></div>
  </article>
}

export default ProblemCard
