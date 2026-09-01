import { useEffect, useState } from 'react'
import { api } from './api'
import Header from './components/Header'
import ProblemCard from './components/ProblemCard'
import ProgressBar from './components/ProgressBar'
import Sidebar from './components/Sidebar'
import StatCard from './components/StatCard'
import TopicCard from './components/TopicCard'

const topicColors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500']

function LoadingState() {
  return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading your practice data…</div>
}

function ErrorState({ message, onRetry }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30"><p className="font-medium text-rose-800 dark:text-rose-200">Unable to load practice data</p><p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{message}</p><button type="button" onClick={onRetry} className="mt-4 cursor-pointer rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">Try again</button></div>
}

function EmptyState({ title, detail }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{detail}</p></div>
}

function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [view, setView] = useState('dashboard')
  const [progress, setProgress] = useState(null)
  const [topics, setTopics] = useState([])
  const [isCoreLoading, setIsCoreLoading] = useState(true)
  const [coreError, setCoreError] = useState('')
  const [collections, setCollections] = useState({
    revision: { items: [], loading: false, error: '' },
    bookmarks: { items: [], loading: false, error: '' },
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  async function loadCoreData(showLoading = true) {
    if (showLoading) setIsCoreLoading(true)
    setCoreError('')
    try {
      const [progressData, topicsData] = await Promise.all([api.getProgress(), api.getTopics()])
      setProgress(progressData)
      setTopics(topicsData)
    } catch (error) {
      setCoreError(error.message)
    } finally {
      if (showLoading) setIsCoreLoading(false)
    }
  }

  async function loadCollection(name) {
    setCollections((current) => ({ ...current, [name]: { ...current[name], loading: true, error: '' } }))
    try {
      const items = name === 'revision' ? await api.getRevision() : await api.getBookmarks()
      setCollections((current) => ({ ...current, [name]: { items, loading: false, error: '' } }))
    } catch (error) {
      setCollections((current) => ({ ...current, [name]: { ...current[name], loading: false, error: error.message } }))
    }
  }

  useEffect(() => { loadCoreData() }, [])
  useEffect(() => {
    if (view === 'revision' || view === 'bookmarks') loadCollection(view)
  }, [view])

  async function handleStatusChange(id, status) {
    try {
      await api.updateStatus(id, status)
      await loadCoreData(false)
      if (view === 'revision' || view === 'bookmarks') await loadCollection(view)
    } catch (error) {
      setCoreError(error.message)
    }
  }

  async function handleBookmarkChange(id, bookmarked) {
    try {
      if (bookmarked) await api.removeBookmark(id)
      else await api.createBookmark(id)
      if (view === 'bookmarks') await loadCollection('bookmarks')
      if (view === 'revision') {
        setCollections((current) => ({ ...current, revision: { ...current.revision, items: current.revision.items.map((problem) => problem.id === id ? { ...problem, bookmarked: !bookmarked } : problem) } }))
      }
    } catch (error) {
      setCoreError(error.message)
    }
  }

  const topicProgressById = new Map((progress?.topics || []).map((topic) => [topic.id, topic]))
  const roadmapTopics = topics.map((topic, index) => ({ ...topic, ...(topicProgressById.get(Number(topic.id)) || {}), color: topicColors[index % topicColors.length] }))

  function renderDashboard() {
    if (isCoreLoading) return <LoadingState />
    if (coreError) return <ErrorState message={coreError} onRetry={() => loadCoreData()} />
    if (!progress) return null

    const stats = [
      { label: 'Solved problems', value: progress.solved, detail: `of ${progress.total} problems`, icon: 'check', tone: 'emerald' },
      { label: 'Revision problems', value: progress.revision, detail: 'ready to revisit', icon: 'refresh', tone: 'amber' },
      { label: 'Not started', value: progress.not_started, detail: 'waiting for your first attempt', icon: 'list', tone: 'slate' },
      { label: 'Total problems', value: progress.total, detail: `across ${progress.topics.length} topics`, icon: 'list', tone: 'blue' },
    ]

    return <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-medium text-violet-600 dark:text-violet-400">Dashboard</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Continue making steady progress, one problem at a time.</p></div><span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Live database data</span></div>
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Practice statistics"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overall progress</p><div className="mt-5 flex items-end justify-between gap-4"><span className="text-3xl font-semibold">{progress.completion_percentage}%</span><span className="text-sm text-slate-500 dark:text-slate-400">{progress.solved} / {progress.total} solved</span></div><ProgressBar value={progress.completion_percentage} className="mt-4" /></div>{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</section>
      <section aria-labelledby="topic-progress-heading"><div className="mb-4 flex items-center justify-between"><div><h2 id="topic-progress-heading" className="text-xl font-semibold">Topic progress</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your current practice coverage by topic.</p></div><button type="button" onClick={() => setView('roadmap')} className="hidden cursor-pointer text-sm font-medium text-violet-600 hover:text-violet-700 sm:block dark:text-violet-400 dark:hover:text-violet-300">View roadmap</button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{roadmapTopics.map((topic) => <TopicCard key={topic.id} {...topic} />)}</div></section>
    </>
  }

  function renderRoadmap() {
    if (isCoreLoading) return <LoadingState />
    if (coreError) return <ErrorState message={coreError} onRetry={() => loadCoreData()} />
    return <><div className="mb-8"><p className="mb-2 text-sm font-medium text-violet-600 dark:text-violet-400">DSA Roadmap</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your practice roadmap</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Topics and their live progress from your tracker.</p></div>{roadmapTopics.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{roadmapTopics.map((topic) => <TopicCard key={topic.id} {...topic} />)}</div> : <EmptyState title="No topics yet" detail="Add topics to the tracker database to start your roadmap." />}</>
  }

  function renderProblemView(name, title, detail) {
    const collection = collections[name]
    return <><div className="mb-8"><p className="mb-2 text-sm font-medium text-violet-600 dark:text-violet-400">{title}</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title} problems</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{detail}</p></div>{collection.loading ? <LoadingState /> : collection.error ? <ErrorState message={collection.error} onRetry={() => loadCollection(name)} /> : collection.items.length ? <div className="grid gap-4">{collection.items.map((problem) => <ProblemCard key={problem.id} problem={name === 'bookmarks' ? { ...problem, bookmarked: true } : problem} onStatusChange={handleStatusChange} onBookmarkChange={handleBookmarkChange} />)}</div> : <EmptyState title={`No ${name} problems`} detail={name === 'revision' ? 'Problems marked for revision will appear here.' : 'Bookmark a problem to keep it handy.'} />}</>
  }

  const content = view === 'dashboard' ? renderDashboard() : view === 'roadmap' ? renderRoadmap() : renderProblemView(view, view === 'revision' ? 'Revision' : 'Bookmarks', view === 'revision' ? 'Revisit these problems when you are ready.' : 'Your saved problems in one place.')

  return <div className="min-h-screen bg-slate-50 pb-16 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 lg:pb-0"><Sidebar activeView={view} onNavigate={setView} /><div className="min-h-screen lg:pl-64"><Header isDark={isDark} onThemeToggle={() => setIsDark((current) => !current)} /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{content}</main></div></div>
}

export default App
