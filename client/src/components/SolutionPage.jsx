import { useEffect, useState } from 'react'
import { api } from '../api'
import NoteModal from './NoteModal'

function Breadcrumbs({ problem }) {
  return <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm">
    <a href="/dashboard" className="font-medium text-violet-400 hover:text-violet-300">/dashboard</a><span className="text-violet-500">/</span>
    <a href="/roadmap" className="font-medium text-violet-400 hover:text-violet-300">/DSA Roadmap</a>
    {problem?.topic?.id ? <><span className="text-violet-500">/</span><a href={`/topic/${problem.topic.id}`} className="font-medium text-violet-400 hover:text-violet-300">/{problem.topic.name}</a></> : null}
    <span className="text-violet-500">/</span><span className="font-medium text-violet-300">/{problem?.title || 'Solution'}</span>
  </nav>
}

function StatusButton({ problem, onStatusChange }) {
  const solved = problem.status === 'solved'
  return <button type="button" onClick={() => onStatusChange(problem.id, solved ? 'not_started' : 'solved')} className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${solved ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#3a3a3a] dark:bg-[#171717] dark:text-slate-300 dark:hover:bg-[#242424]'}`}><span className={`inline-flex h-5 w-5 items-center justify-center rounded-md border text-xs ${solved ? 'border-white bg-white text-emerald-600' : 'border-current text-transparent'}`}>✓</span>{solved ? 'Solved' : 'Mark solved'}</button>
}
function BookmarkButton({ problem, onBookmarkChange }) { const active=Boolean(problem.bookmarked); return <button type="button" onClick={() => onBookmarkChange(problem.id, active)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-200"><span className="text-base leading-none">{active?'★':'☆'}</span>{active?'Bookmarked':'Bookmark'}</button> }
function RevisionButton({ problem, onRevisionChange }) { const active=Boolean(problem.revision); return <button type="button" onClick={() => onRevisionChange(problem.id,!active)} className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${active?'border-sky-500 bg-sky-500 text-white':'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#3a3a3a] dark:bg-[#171717] dark:text-slate-300 dark:hover:bg-[#242424]'}`}>↻ {active?'Revision':'Add revision'}</button> }

function Section({ title, children }) {
  const [open,setOpen]=useState(false)
  return <section className="overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-[#333333] dark:bg-[#181818]"><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-[#222222]"><span>{title}</span><span className="text-lg leading-none text-slate-500 dark:text-slate-400">{open?'⌃':'⌄'}</span></button>{open?<div className="border-t border-slate-200 px-5 py-5 dark:border-[#333333]">{children}</div>:null}</section>
}
function TextBlock({ text }) { return <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{text}</div> }

function cleanSectionText(text) {
  return (text || '').trim()
}

function parseImportedStatement(raw) {
  const source = raw || ''
  if (!source.trim()) return { statement: '', examples: '', approach: '', time: '', space: '' }
  const examplesMarker = /\n?Example\s+1\s*:/i
  const approachMarker = /\n?APPROACH\s*:-/i
  const timeMarker = /\n?Time\s+complexity\s+of\s+this\s+approach\s+is/i
  const spaceMarker = /\n?Space\s+complexity\s+is/i
  const codeMarker = /\n?CODE\s*:-/i
  const examplesMatch = examplesMarker.exec(source)
  const approachMatch = approachMarker.exec(source)
  const timeMatch = timeMarker.exec(source)
  const spaceMatch = spaceMarker.exec(source)
  const codeMatch = codeMarker.exec(source)

  const statementEnd = examplesMatch?.index ?? approachMatch?.index ?? timeMatch?.index ?? spaceMatch?.index ?? codeMatch?.index ?? source.length
  const statement = source.slice(0, statementEnd).trim()
  const examples = examplesMatch
    ? source.slice(examplesMatch.index, approachMatch?.index ?? timeMatch?.index ?? spaceMatch?.index ?? codeMatch?.index ?? source.length).trim()
    : ''
  const approach = approachMatch
    ? source.slice(approachMatch.index + approachMatch[0].length, timeMatch?.index ?? spaceMatch?.index ?? codeMatch?.index ?? source.length).trim()
    : ''
  const time = timeMatch
    ? source.slice(timeMatch.index, spaceMatch?.index ?? codeMatch?.index ?? source.length).trim()
    : ''
  const space = spaceMatch
    ? source.slice(spaceMatch.index, codeMatch?.index ?? source.length).trim()
    : ''
  return { statement, examples, approach, time, space }
}

function SolutionPage({ problemId, onStatusChange, onRevisionChange, onBookmarkChange, onRequireAuth }) {
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [notingProblem,setNotingProblem]=useState(null)
  useEffect(()=>{let cancelled=false; async function load(){setLoading(true);setError('');try{const result=await api.getSolution(problemId);if(!cancelled)setData(result)}catch(e){if(!cancelled)setError(e.message||'Unable to load the solution.')}finally{if(!cancelled)setLoading(false)}} if(problemId)load(); return()=>{cancelled=true}},[problemId])
  if(loading)return <div className="rounded-xl border border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-[#333333] dark:bg-[#181818] dark:text-slate-400">Loading solution…</div>
  if(error)return <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-6 text-sm text-rose-300">{error}</div>
  if(!data?.problem)return <div className="rounded-xl border border-slate-300 bg-white p-8 text-center dark:border-[#333333] dark:bg-[#181818]">Problem not found.</div>
  const {problem,solution}=data
  async function toggleStatus(){if(!onStatusChange)return onRequireAuth?.();const next=problem.status==='solved'?'not_started':'solved';await onStatusChange(problem.id,next);setData(c=>({...c,problem:{...c.problem,status:next}}))}
  async function toggleBookmark(){if(!onBookmarkChange)return onRequireAuth?.();const active=Boolean(problem.bookmarked);await onBookmarkChange(problem.id,active);setData(c=>({...c,problem:{...c.problem,bookmarked:!active}}))}
  async function toggleRevision(){if(!onRevisionChange)return onRequireAuth?.();const active=Boolean(problem.revision);await onRevisionChange(problem.id,!active);setData(c=>({...c,problem:{...c.problem,revision:!active}}))}
  const notesButton = <button type="button" onClick={()=>onRequireAuth ? onRequireAuth() : setNotingProblem(problem)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#3a3a3a] dark:bg-[#171717] dark:text-slate-300 dark:hover:bg-[#242424]">Notes</button>
  if(!solution?.available)return <><Breadcrumbs problem={problem}/><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{problem.title}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400 capitalize">{problem.difficulty} · {problem.topic?.name||'DSA'}</p>{notesButton}{notingProblem && <NoteModal problem={notingProblem} onClose={() => setNotingProblem(null)} />}</>
  const parsed = parseImportedStatement(solution.problem_statement)
  const problemStatement = cleanSectionText(parsed.statement || solution.problem_statement)
  const examples = cleanSectionText(solution.examples || parsed.examples)
  const approach = cleanSectionText(parsed.approach || solution.optimal_approach || solution.better_approach || solution.brute_force)
  const time = cleanSectionText(parsed.time)
  const space = cleanSectionText(parsed.space)
  const code = cleanSectionText(solution.code)
  return <><Breadcrumbs problem={problem}/><div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-[#333333]"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{problem.title}</h1><div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><span className="capitalize">{problem.difficulty}</span>{problem.pattern?<><span>·</span><span>{problem.pattern}</span></>:null}</div></div><div className="flex flex-wrap gap-2"><StatusButton problem={problem} onStatusChange={toggleStatus}/><BookmarkButton problem={problem} onBookmarkChange={toggleBookmark}/><RevisionButton problem={problem} onRevisionChange={toggleRevision}/></div></div></div>
    {problemStatement ? <section className="mb-4"><h2 className="mb-3 text-lg font-semibold">Problem Statement</h2><TextBlock text={problemStatement}/></section> : null}
    <div className="space-y-3">
      {examples ? <Section title="Examples"><TextBlock text={examples}/></Section> : null}
      {approach ? <Section title="Approach"><TextBlock text={approach}/></Section> : null}
      {code ? <Section title={`Solution / Code${solution.code_language?` · ${solution.code_language}`:''}`}><div className="overflow-x-auto rounded-lg border border-slate-300 bg-slate-50 dark:border-[#333333] dark:bg-[#101010]"><pre className="min-w-max p-5 text-sm leading-6 text-slate-800 dark:text-slate-200"><code>{code}</code></pre></div><button type="button" onClick={()=>navigator.clipboard?.writeText(code)} className="mt-3 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#3a3a3a] dark:bg-[#171717] dark:text-slate-300 dark:hover:bg-[#242424]">Copy code</button></Section> : null}
      {time ? <Section title="Time Complexity"><TextBlock text={time}/></Section> : null}
      {space ? <Section title="Space Complexity"><TextBlock text={space}/></Section> : null}
    </div>
    <div className="mt-6 flex flex-nowrap gap-2 overflow-x-auto border-t border-slate-200 pt-5 dark:border-[#333333]">{problem.leetcode_url?<a href={problem.leetcode_url} target="_blank" rel="noreferrer" className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-500/20 dark:text-violet-200">LeetCode</a>:null}{problem.gfg_url?<a href={problem.gfg_url} target="_blank" rel="noreferrer" className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-200">GFG</a>:null}{problem.article_url?<a href={problem.article_url} target="_blank" rel="noreferrer" className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-200">TUF</a>:null}{problem.youtube_url?<a href={problem.youtube_url} target="_blank" rel="noreferrer" className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-500/20 dark:text-rose-200">YouTube</a>:null}{notesButton}</div>{notingProblem && <NoteModal problem={notingProblem} onClose={() => setNotingProblem(null)} />}
  </>
}
export default SolutionPage
