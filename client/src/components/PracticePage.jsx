import { useState } from 'react'
import { api } from '../api'

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function YouTubeIcon() {
  return <img src="/youtube-icon.png" alt="" className="h-4 w-4 object-contain" aria-hidden="true" />
}

function PracticePage({ onStatusChange }) {
  const [count, setCount] = useState('')
  const [allProblems, setAllProblems] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [topicInfoId, setTopicInfoId] = useState(null)

  async function generate() {
    const requested = Number.parseInt(count, 10)
    if (!Number.isInteger(requested) || requested < 1) { setError('Enter a number between 1 and 474 to generate questions.'); return }
    setLoading(true); setError('')
    try {
      const pool = allProblems.length ? allProblems : await api.getProblems()
      setAllProblems(pool)
      if (requested > pool.length) { setError(`You can choose at most ${pool.length} questions.`); setQuestions([]); return }
      setQuestions(shuffle(pool).slice(0, requested))
    } catch (requestError) { setError(requestError.message || 'Unable to load practice questions.') }
    finally { setLoading(false) }
  }

  async function solve(problem) {
    await onStatusChange(problem.id, problem.status === 'solved' ? 'not_started' : 'solved')
    setQuestions((current) => current.map((item) => item.id === problem.id ? { ...item, status: problem.status === 'solved' ? 'not_started' : 'solved' } : item))
  }

  return <>
    <div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Random practice</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Choose how many questions you want to practice. We will randomly pick that many problems from the full set of 474 questions, so you can practice without following the roadmap order.</p></div>
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#303030] dark:bg-[#171717]"><div className="flex flex-col gap-4 sm:flex-row sm:items-end"><label className="block w-full max-w-xs"><span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Number of questions</span><input type="number" min="1" max="474" value={count} onChange={(event) => setCount(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100" /></label><button type="button" onClick={generate} disabled={loading} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">{loading ? 'Generating…' : questions.length ? 'Generate new set' : 'Generate questions'}</button></div>{error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}</section>
    {questions.length ? <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Your practice set</h2><span className="text-sm text-slate-500 dark:text-slate-400">{questions.length} questions</span></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#303030] dark:bg-[#171717]"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-[#303030] dark:bg-[#111111] dark:text-slate-400"><tr><th className="w-14 px-4 py-3">#</th><th className="px-4 py-3">Problem</th><th className="w-28 px-4 py-3">Difficulty</th><th className="w-24 px-4 py-3 text-center">Solved</th><th className="w-20 px-4 py-3 text-center">Hint</th><th className="w-40 px-4 py-3">Practice</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-[#303030]">{questions.map((problem,index)=><tr key={problem.id} className="hover:bg-slate-50 dark:hover:bg-[#242424]/40"><td className="px-4 py-4 text-slate-400">{index+1}</td><td className="px-4 py-4"><span>{problem.title}</span></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${problem.difficulty==='easy'?'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300':problem.difficulty==='medium'?'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300':'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`}>{problem.difficulty}</span></td><td className="px-4 py-4 text-center"><button type="button" onClick={()=>solve(problem)} className={`inline-flex h-6 w-6 items-center justify-center rounded-md border ${problem.status==='solved'?'border-emerald-500 bg-emerald-500 text-white':'border-slate-300 text-transparent dark:border-[#3a3a3a]'}`} title={problem.status==='solved'?'Mark as not solved':'Mark as solved'}>✓</button></td><td className="relative px-4 py-4 text-center"><button type="button" title="Show topic and subtopic" aria-label={`Show topic and subtopic for ${problem.title}`} onClick={() => setTopicInfoId((current) => current === problem.id ? null : problem.id)} className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-500 hover:border-violet-400 hover:text-violet-600 dark:border-[#3a3a3a] dark:text-slate-400 dark:hover:border-violet-500 dark:hover:text-violet-300">i</button>{topicInfoId === problem.id && <div className="absolute right-2 top-12 z-20 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs shadow-xl dark:border-[#3a3a3a] dark:bg-[#171717]"><p className="font-semibold text-slate-900 dark:text-slate-100">{problem.topic?.name || '—'}</p><p className="mt-1 text-slate-500 dark:text-slate-400">{problem.subtopic?.name || '—'}</p></div>}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-1">{problem.leetcode_url && <a href={problem.leetcode_url} target="_blank" rel="noreferrer" title="LeetCode" className="inline-flex h-8 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-500/20 dark:text-violet-200">LeetCode</a>}{problem.article_url && <a href={problem.article_url} target="_blank" rel="noreferrer" title="Article" aria-label="Article" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-200"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h5" /></svg></a>}{problem.youtube_url && <a href={problem.youtube_url} target="_blank" rel="noreferrer" title="YouTube" aria-label="YouTube" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-200"><YouTubeIcon /></a>}</div></td></tr>)}</tbody></table></div></div></section> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-[#3a3a3a] dark:bg-[#171717]"><p className="font-semibold">Ready when you are</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter a number above and generate a random practice set.</p></div>}
  </>
}
export default PracticePage
