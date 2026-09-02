import { useState } from 'react'

const difficultyStyles = {
  easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  hard: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
}

function IconButton({ label, active = false, tone = 'violet', onClick, disabled, children }) {
  const activeStyles = {
    violet: 'border-violet-300 bg-violet-100 text-violet-700 shadow-sm dark:border-violet-500/50 dark:bg-violet-500/20 dark:text-violet-200',
    blue: 'border-sky-500 bg-sky-500 text-white shadow-sm dark:border-sky-400 dark:bg-sky-500 dark:text-white',
  }
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled} className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all duration-150 disabled:cursor-wait disabled:opacity-50 ${active ? activeStyles[tone] : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-[#3a3a3a] dark:bg-[#171717] dark:text-slate-500 dark:hover:border-[#4a4a4a] dark:hover:bg-[#242424] dark:hover:text-slate-200'}`}>
      {children}
    </button>
  )
}

function BookmarkIcon({ active }) {
  return <span className={`text-[1.15rem] leading-none transition-transform ${active ? 'scale-105 text-amber-400 drop-shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>{active ? '★' : '☆'}</span>
}

function RevisionIcon({ active }) {
  return <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>
}

function InfoIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></svg>
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
}

function ArticleIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h5" /></svg>
}

function YouTubeIcon() {
  return <img src="/youtube-icon.png" alt="" className="h-4 w-4 object-contain" aria-hidden="true" />
}

function ExternalLink({ href, label, tone = 'default', iconOnly = false, children }) {
  if (!href) return null
  const tones = {
    leetcode: 'border-violet-500/40 bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 dark:text-violet-200',
    gfg: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-200',
    article: 'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-200',
    youtube: 'border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-200',
    default: 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#3a3a3a] dark:bg-[#171717] dark:text-slate-300 dark:hover:bg-[#242424]',
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${iconOnly ? 'w-8 px-0' : ''} ${tones[tone] || tones.default}`}>{children || label}</a>
}

function SolutionLink({ problem }) {
  return <a href={`/solution/${problem.id}`} title={`View solution for ${problem.title}`} aria-label={`View solution for ${problem.title}`} className="inline-flex h-8 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-200">Solution</a>
}

function PatternPopover({ problem, onClose }) {
  return (
    <div className="absolute right-0 top-11 z-20 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl dark:border-[#3a3a3a] dark:bg-[#171717]" role="dialog" aria-label={`Pattern details for ${problem.title}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pattern / hint</p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{problem.pattern || 'No pattern added yet.'}</p>
        </div>
        <button type="button" title="Close pattern details" aria-label="Close pattern details" onClick={onClose} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-[#3a3a3a] dark:bg-[#242424] dark:text-slate-300 dark:hover:border-[#4a4a4a] dark:hover:bg-[#303030] dark:hover:text-white"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
      </div>
      {(problem.time_complexity || problem.space_complexity) && <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-slate-50 p-2 dark:bg-[#242424]"><span className="block text-slate-400">Time</span><span className="mt-0.5 block font-medium text-slate-700 dark:text-slate-200">{problem.time_complexity || '—'}</span></div><div className="rounded-lg bg-slate-50 p-2 dark:bg-[#242424]"><span className="block text-slate-400">Space</span><span className="mt-0.5 block font-medium text-slate-700 dark:text-slate-200">{problem.space_complexity || '—'}</span></div></div>}
      {problem.optimal_approach && <div className="mt-3"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approach</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{problem.optimal_approach}</p></div>}
    </div>
  )
}

export function EditLinksModal({ problem, onClose, onSave }) {
  const [values, setValues] = useState({ leetcode_url: problem.leetcode_url || '', gfg_url: problem.gfg_url || '', article_url: problem.article_url || '', youtube_url: problem.youtube_url || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fields = [['leetcode_url', 'LeetCode URL', 'https://leetcode.com/problems/...'], ['gfg_url', 'GeeksforGeeks URL', 'https://www.geeksforgeeks.org/...'], ['article_url', 'TUF / Article URL', 'https://takeuforward.org/...'], ['youtube_url', 'YouTube URL', 'https://www.youtube.com/watch?v=...']]
  function update(field, value) { setValues((current) => ({ ...current, [field]: value })) }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try { await onSave(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim() || null]))); onClose() }
    catch (saveError) { setError(saveError.message || 'Unable to save changes.') }
    finally { setSaving(false) }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div role="dialog" aria-modal="true" aria-labelledby="edit-links-title" className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#3a3a3a] dark:bg-[#171717]"><div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-[#303030]"><div><p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">Edit resources</p><h2 id="edit-links-title" className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{problem.title}</h2></div><button type="button" title="Close editor" aria-label="Close editor" onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">×</button></div><form onSubmit={submit}><div className="space-y-4 p-5">{fields.map(([key, label, placeholder]) => <label key={key} className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span><input value={values[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} type="url" inputMode="url" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100" /></label>)}{error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}</div><div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-[#303030]"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-[#3a3a3a] dark:text-slate-300 dark:hover:bg-[#242424]">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button></div></form></div></div>
}

function SolvedIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
}

function ProblemList({ problems, onStatusChange, onBookmarkChange, onRevisionChange, onProblemUpdate, showEdit = false }) {
  const [updatingId, setUpdatingId] = useState(null)
  const [openPatternId, setOpenPatternId] = useState(null)
  const [editingProblem, setEditingProblem] = useState(null)

  async function changeStatus(problem, event) {
    setUpdatingId(problem.id)
    try { await onStatusChange(problem.id, event.target.checked ? 'solved' : 'not_started') } finally { setUpdatingId(null) }
  }
  async function toggleBookmark(problem) {
    setUpdatingId(problem.id)
    try { await onBookmarkChange(problem.id, Boolean(problem.bookmarked)) } finally { setUpdatingId(null) }
  }
  async function toggleRevision(problem) {
    setUpdatingId(problem.id)
    try { await onRevisionChange(problem.id, !Boolean(problem.revision)) } finally { setUpdatingId(null) }
  }
  async function saveLinks(fields) { if (onProblemUpdate) await onProblemUpdate(editingProblem.id, fields) }

  return <>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#303030] dark:bg-[#171717]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-[#303030] dark:bg-[#111111] dark:text-slate-400"><tr><th className="w-14 px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">Problem</th><th className="w-28 px-4 py-3 font-semibold">Difficulty</th><th className="w-20 px-4 py-3 text-center font-semibold">Solved</th><th className="w-20 px-4 py-3 text-center font-semibold">Bookmark</th><th className="w-20 px-4 py-3 text-center font-semibold">Revision</th><th className="w-16 px-4 py-3 text-center font-semibold">Pattern</th><th className="w-72 px-4 py-3 font-semibold">Practice</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#303030]">
            {problems.map((problem, index) => <tr key={problem.id} className="align-middle hover:bg-slate-50 dark:hover:bg-[#242424]/40">
              <td className="px-4 py-4 text-slate-400">{index + 1}</td>
              <td className="px-4 py-4"><div className="font-semibold text-slate-900 dark:text-slate-100">{problem.title}</div></td>
              <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${difficultyStyles[problem.difficulty]}`}>{problem.difficulty}</span></td>
              <td className="px-4 py-4 text-center"><label className="inline-flex cursor-pointer items-center justify-center" title={problem.status === 'solved' ? 'Mark as not solved' : 'Mark as solved'}><input type="checkbox" checked={problem.status === 'solved'} onChange={(event) => changeStatus(problem, event)} disabled={updatingId === problem.id} className="peer sr-only" aria-label={`${problem.status === 'solved' ? 'Mark as not solved' : 'Mark as solved'}: ${problem.title}`} /><span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-transparent transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:shadow-sm dark:border-[#3a3a3a] dark:bg-[#171717] dark:peer-checked:border-emerald-500 dark:peer-checked:bg-emerald-500">{problem.status === 'solved' ? <SolvedIcon /> : null}</span></label></td>
              <td className="px-4 py-4 text-center"><button type="button" title={problem.bookmarked ? 'Remove bookmark' : 'Bookmark'} aria-label={problem.bookmarked ? 'Remove bookmark' : 'Bookmark'} onClick={() => toggleBookmark(problem)} disabled={updatingId === problem.id} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center border-0 bg-transparent disabled:cursor-wait disabled:opacity-50"><BookmarkIcon active={problem.bookmarked} /></button></td>
              <td className="px-4 py-4 text-center"><IconButton label={problem.revision ? 'Remove from revision' : 'Add to revision'} tone="blue" active={problem.revision} onClick={() => toggleRevision(problem)} disabled={updatingId === problem.id}><RevisionIcon active={problem.revision} /></IconButton></td>
              <td className="relative px-4 py-4 text-center"><IconButton label="View pattern and hint" active={openPatternId === problem.id} onClick={() => setOpenPatternId((current) => current === problem.id ? null : problem.id)}><InfoIcon /></IconButton>{openPatternId === problem.id && <PatternPopover problem={problem} onClose={() => setOpenPatternId(null)} />}</td>
              <td className="px-4 py-4"><div className="flex flex-wrap items-center gap-1"><ExternalLink href={problem.leetcode_url} label="LeetCode" tone="leetcode" /><ExternalLink href={problem.gfg_url} label="GFG" tone="gfg" /><ExternalLink href={problem.article_url} label="TUF" tone="article" /><ExternalLink href={problem.youtube_url} label="YouTube" tone="youtube" /><SolutionLink problem={problem} /><>{showEdit && <button type="button" title="Edit practice links" aria-label={`Edit practice links for ${problem.title}`} onClick={() => setEditingProblem(problem)} className="ml-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#242424] dark:hover:text-slate-200"><EditIcon /></button>}</></div></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
    {!problems.length && <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-[#3a3a3a] dark:text-slate-400">No problems match this view.</div>}
    {editingProblem && <EditLinksModal problem={editingProblem} onClose={() => setEditingProblem(null)} onSave={saveLinks} />}
  </>
}

export default ProblemList
