import { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import ProblemList from './components/ProblemList'
import ProgressBar from './components/ProgressBar'
import Sidebar from './components/Sidebar'
import TopicTable from './components/TopicTable'
import PracticePage from './components/PracticePage'
import StreakPage from './components/StreakPage'

function LoadingState() {
  return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading your practice data…</div>
}

function ErrorState({ message, onRetry }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30"><p className="font-medium text-rose-800 dark:text-rose-200">Unable to load practice data</p><p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{message}</p><button type="button" onClick={onRetry} className="mt-4 cursor-pointer rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">Try again</button></div>
}

function ArticleIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h5" /></svg>
}

function YouTubeIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" /></svg>
}

function PracticeLink({ href, label, tone = 'default', iconOnly = false, children }) {
  if (!href) return null
  const tones = {
    leetcode: 'border-violet-500/40 bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 dark:text-violet-200',
    gfg: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-200',
    article: 'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-200',
    youtube: 'border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-200',
    default: 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
  }
  return <a href={href} target="_blank" rel="noreferrer" title={label} aria-label={label} className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${iconOnly ? 'w-8 px-0' : ''} ${tones[tone] || tones.default}`}>{children || label}</a>
}

function EmptyState({ title, detail }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{detail}</p></div>
}

function routeFor(view, topic = null) {
  if (view === 'topic' && topic) return `/topic/${topic.id}`
  return view === 'dashboard' ? '/' : `/${view}`
}

function getRoute() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const topicMatch = path.match(/^\/topic\/(\d+)$/)
  if (topicMatch) return { view: 'topic', topicId: Number(topicMatch[1]) }
  const view = path.slice(1)
  return { view: ['roadmap', 'revision', 'bookmarks', 'practice', 'streaks'].includes(view) ? view : 'dashboard' }
}

function Breadcrumbs({ items }) {
  return <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm">{items.map((item, index) => {
    const isCurrent = index === items.length - 1
    const label = `/${item.label}`
    return <span key={`${item.label}-${index}`} className="flex items-center">
      {item.onClick ? <button type="button" onClick={item.onClick} className="cursor-pointer font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">{label}</button> : <span className={isCurrent ? 'font-medium text-violet-300' : 'font-medium text-violet-400'}>{label}</span>}
    </span>
  })}</nav>
}

function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [view, setView] = useState(() => getRoute().view)
  const [roadmapSearch, setRoadmapSearch] = useState('')
  const [roadmapProblems, setRoadmapProblems] = useState([])
  const [topicStatusFilter, setTopicStatusFilter] = useState('all')
  const [topicDifficultyFilter, setTopicDifficultyFilter] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [topicProblems, setTopicProblems] = useState({ items: [], loading: false, error: '' })
  const [progress, setProgress] = useState(null)
  const [topics, setTopics] = useState([])
  const [isCoreLoading, setIsCoreLoading] = useState(true)
  const [coreError, setCoreError] = useState('')
  const [databaseStatus, setDatabaseStatus] = useState('checking')
  const [openSubtopics, setOpenSubtopics] = useState(() => new Set())
  const [quote, setQuote] = useState(null)
  const [streakSummary, setStreakSummary] = useState(null)
  const [collectionStatusFilter, setCollectionStatusFilter] = useState('all')
  const [collectionDifficultyFilter, setCollectionDifficultyFilter] = useState('all')
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
      const [progressData, topicsData, problemsData] = await Promise.all([api.getProgress(), api.getTopics(), api.getProblems()])
      setProgress(progressData)
      setTopics(topicsData)
      setRoadmapProblems(problemsData)
    } catch (error) {
      setCoreError(error.message)
    } finally {
      if (showLoading) setIsCoreLoading(false)
    }
  }

  function handleNavigate(nextView) {
    if (nextView === 'roadmap') {
      setRoadmapSearch('')
      setOpenSubtopics(new Set())
    }
    if (nextView === 'revision' || nextView === 'bookmarks') {
      setCollectionStatusFilter('all')
      setCollectionDifficultyFilter('all')
    }
    window.history.pushState({}, '', routeFor(nextView))
    setSelectedTopic(null)
    setView(nextView)
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

  async function loadTopicProblems(topic, { updateUrl = true } = {}) {
    if (updateUrl) window.history.pushState({}, '', routeFor('topic', topic))
    setSelectedTopic(topic)
    setTopicStatusFilter('all')
    setTopicDifficultyFilter('all')
    setView('topic')
    setTopicProblems({ items: [], loading: true, error: '' })
    try {
      const items = await api.getProblems({ topic_id: topic.id })
      setTopicProblems({ items, loading: false, error: '' })
    } catch (error) {
      setTopicProblems({ items: [], loading: false, error: error.message })
    }
  }

  useEffect(() => { loadCoreData() }, [])

  useEffect(() => {
    const handlePopState = () => {
      const route = getRoute()
      if (route.view === 'topic') {
        const topic = topics.find((item) => Number(item.id) === route.topicId)
        if (topic) loadTopicProblems(topic, { updateUrl: false })
      } else {
        setSelectedTopic(null)
        setView(route.view)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [topics])

  useEffect(() => {
    const route = getRoute()
    if (route.view === 'topic' && topics.length) {
      const topic = topics.find((item) => Number(item.id) === route.topicId)
      if (topic && (!selectedTopic || Number(selectedTopic.id) !== Number(topic.id))) loadTopicProblems(topic, { updateUrl: false })
    }
  }, [topics])

  useEffect(() => {
    if (view !== 'dashboard') return
    const date = new Intl.DateTimeFormat('en-CA').format(new Date())
    Promise.all([api.getDailyQuote(date), api.getStreaks(date)])
      .then(([quoteData, streakData]) => { setQuote(quoteData); setStreakSummary(streakData) })
      .catch(() => { setQuote(null); setStreakSummary(null) })
  }, [view])

  useEffect(() => {
    let cancelled = false

    async function checkDatabase() {
      try {
        await api.getDatabaseHealth()
        if (!cancelled) setDatabaseStatus('connected')
      } catch {
        if (!cancelled) setDatabaseStatus('offline')
      }
    }

    checkDatabase()
    const interval = window.setInterval(checkDatabase, 30000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])
  useEffect(() => {
    if (view === 'revision' || view === 'bookmarks') loadCollection(view)
  }, [view])

  async function handleStatusChange(id, status) {
    try {
      const activityDate = new Intl.DateTimeFormat('en-CA').format(new Date())
      await api.updateStatus(id, status, activityDate)
      await loadCoreData(false)
      setRoadmapProblems((current) => current.map((problem) => problem.id === id ? { ...problem, status } : problem))
      if (view === 'topic' && selectedTopic) {
        const items = await api.getProblems({ topic_id: selectedTopic.id })
        setTopicProblems((current) => ({ ...current, items }))
      }
      if (view === 'revision' || view === 'bookmarks') await loadCollection(view)
    } catch (error) {
      setCoreError(error.message)
    }
  }

  async function handleRevisionChange(id, revision) {
    try {
      await api.updateRevision(id, revision)
      await loadCoreData(false)
      if (view === 'topic' && selectedTopic) {
        const items = await api.getProblems({ topic_id: selectedTopic.id })
        setTopicProblems((current) => ({ ...current, items }))
      }
      if (view === 'revision' || view === 'bookmarks') await loadCollection(view)
    } catch (error) {
      setCoreError(error.message)
    }
  }

  async function handleProblemUpdate(id, fields) {
    try {
      const updated = await api.updateProblem(id, fields)
      const mergeUpdated = (items) => items.map((problem) => problem.id === id ? { ...problem, ...updated } : problem)
      setTopicProblems((current) => ({ ...current, items: mergeUpdated(current.items) }))
      setRoadmapProblems((current) => current.map((problem) => problem.id === id ? { ...problem, ...updated } : problem))
      setCollections((current) => ({
        ...current,
        revision: { ...current.revision, items: mergeUpdated(current.revision.items) },
        bookmarks: { ...current.bookmarks, items: mergeUpdated(current.bookmarks.items) },
      }))
    } catch (error) {
      setCoreError(error.message)
      throw error
    }
  }

  async function handleBookmarkChange(id, bookmarked) {
    try {
      if (bookmarked) await api.removeBookmark(id)
      else await api.createBookmark(id)
      if (view === 'topic' && selectedTopic) {
        setTopicProblems((current) => ({ ...current, items: current.items.map((problem) => problem.id === id ? { ...problem, bookmarked: !bookmarked } : problem) }))
      }
      await loadCoreData(false)
      if (view === 'bookmarks') await loadCollection('bookmarks')
      if (view === 'revision') await loadCollection('revision')
    } catch (error) {
      setCoreError(error.message)
    }
  }

  const topicProgressById = new Map((progress?.topics || []).map((topic) => [topic.id, topic]))
  const roadmapTopics = useMemo(() => topics.map((topic) => ({ ...topic, ...(topicProgressById.get(Number(topic.id)) || {}) })), [topics, progress])

  function renderDashboard() {
    if (isCoreLoading) return <LoadingState />
    if (coreError) return <ErrorState message={coreError} onRetry={() => loadCoreData()} />
    if (!progress) return null

    const revisionCount = Number(progress.revision || 0)
    const bookmarkCount = Number(progress.bookmarks || 0)

    const difficultyCards = ['easy','medium','hard'].map((level) => {
      const item = progress.difficulty?.[level] || { solved: 0, total: 0 }
      const pct = item.total ? Math.round((item.solved / item.total) * 100) : 0
      const tone = level === 'easy' ? 'emerald' : level === 'medium' ? 'amber' : 'rose'
      return <article key={level} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><p className="text-sm font-semibold capitalize">{level}</p><span className={`rounded-full px-2 py-1 text-xs font-semibold ${tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : tone === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`}>{item.solved}/{item.total}</span></div><div className="mt-4 flex items-end justify-between"><span className="text-2xl font-semibold">{item.solved} solved</span><span className="text-sm text-slate-500 dark:text-slate-400">{pct}%</span></div><ProgressBar value={pct} className="mt-3" /></article>
    })

    return <>
      <Breadcrumbs items={[{ label: 'dashboard' }]} />
      <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-[2.2rem]">Welcome back</h1>
          <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-amber-700 drop-shadow-[0_0_14px_rgba(245,158,11,0.22)] dark:text-amber-200 dark:drop-shadow-[0_0_16px_rgba(245,158,11,0.20)]">
            {quote ? <>{quote.quote_text}{quote.author ? <span className="ml-2 font-semibold text-amber-600 dark:text-amber-300">— {quote.author}</span> : null}</> : 'Keep solving, learning, and revising one problem at a time.'}
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <span className={`h-2 w-2 rounded-full ${databaseStatus === 'connected' ? 'bg-emerald-500' : databaseStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-500'}`} aria-hidden="true" />
          {databaseStatus === 'connected' ? 'Database live' : databaseStatus === 'checking' ? 'Checking database' : 'Database offline'}
        </div>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard progress">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overall Progress</p>
          <div className="mt-5 flex items-end justify-between gap-4"><span className="text-3xl font-semibold">{progress.completion_percentage}%</span><span className="text-sm text-slate-500 dark:text-slate-400">{progress.solved} / {progress.total} solved</span></div>
          <ProgressBar value={progress.completion_percentage} className="mt-4" />
        </div>

        {[
          ['Current Streak', `${streakSummary?.current_streak ?? 0} ${(streakSummary?.current_streak ?? 0) === 1 ? 'day' : 'days'}`, '🔥'],
          ['Longest Streak', `${streakSummary?.longest_streak ?? 0} ${(streakSummary?.longest_streak ?? 0) === 1 ? 'day' : 'days'}`, '🏆'],
          ['Active Days', streakSummary?.active_days ?? 0, '✓'],
        ].map(([label, value, icon]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><span className="text-base text-violet-500" aria-hidden="true">{icon}</span></div><p className="mt-4 text-2xl font-semibold">{value}</p></article>)}

        <div className="grid grid-cols-2 gap-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Revision</p><span className="text-base text-sky-400" aria-hidden="true">↻</span></div>
            <p className="mt-4 text-2xl font-semibold">{revisionCount}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Bookmarks</p><span className="text-base text-amber-400" aria-hidden="true">★</span></div>
            <p className="mt-4 text-2xl font-semibold">{bookmarkCount}</p>
          </article>
        </div>

        {difficultyCards}
      </section>

      <section aria-labelledby="topic-progress-heading"><div className="mb-4 flex items-center justify-between"><div><h2 id="topic-progress-heading" className="text-xl font-semibold">Topic progress</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open a topic to work through its problems.</p></div><button type="button" onClick={() => handleNavigate('roadmap')} className="cursor-pointer text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">View roadmap</button></div><TopicTable topics={roadmapTopics} onSelectTopic={loadTopicProblems} /></section>
    </>
  }
  function renderRoadmap() {
    if (isCoreLoading) return <LoadingState />
    if (coreError) return <ErrorState message={coreError} onRetry={() => loadCoreData()} />
    const query = roadmapSearch.trim().toLowerCase()
    const matchingProblems = query ? roadmapProblems.filter((problem) => problem.title.toLowerCase().includes(query)) : []

    return <>
      <Breadcrumbs items={[{ label: 'dashboard', onClick: () => handleNavigate('dashboard') }, { label: 'DSA Roadmap' }]} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your practice roadmap</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose a topic to see its subtopics and problems.</p>
        </div>
        <div className="w-full sm:max-w-sm">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Search problems</label>
          <input value={roadmapSearch} onChange={(event) => setRoadmapSearch(event.target.value)} placeholder="Search by problem name…" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
      </div>
      {query ? (matchingProblems.length ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">Showing {matchingProblems.length} matching {matchingProblems.length === 1 ? 'problem' : 'problems'}</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"><tr><th className="w-14 px-5 py-3">#</th><th className="px-5 py-3">Problem</th><th className="px-5 py-3">Topic</th><th className="px-5 py-3">Subtopic</th><th className="w-28 px-5 py-3">Difficulty</th><th className="w-24 px-5 py-3 text-center">Solved</th><th className="w-72 px-5 py-3">Practice</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {matchingProblems.map((problem, index) => {
                const topic = roadmapTopics.find((item) => Number(item.id) === Number(problem.topic?.id))
                return <tr key={problem.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-4 text-slate-400">{index + 1}</td>
                  <td className="px-5 py-4"><button type="button" onClick={() => topic && loadTopicProblems(topic)} className="cursor-pointer text-left font-semibold text-slate-900 hover:text-violet-600 dark:text-slate-100 dark:hover:text-violet-300">{problem.title}</button></td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{problem.topic?.name || '—'}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{problem.subtopic?.name || '—'}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${problem.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : problem.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`}>{problem.difficulty}</span></td>
                  <td className="px-5 py-4 text-center">{problem.status === 'solved' ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">Solved</span> : <span className="text-slate-400">—</span>}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{problem.leetcode_url && <PracticeLink href={problem.leetcode_url} label="LeetCode" tone="leetcode" />}{problem.gfg_url && <PracticeLink href={problem.gfg_url} label="GFG" tone="gfg" />}{problem.article_url && <PracticeLink href={problem.article_url} label="Article" tone="article" iconOnly><ArticleIcon /></PracticeLink>}{problem.youtube_url && <PracticeLink href={problem.youtube_url} label="YouTube" tone="youtube" iconOnly><YouTubeIcon /></PracticeLink>}</div></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </div> : <EmptyState title="No matching problems" detail="Try a different problem name." />) : <TopicTable topics={roadmapTopics} onSelectTopic={loadTopicProblems} />}
    </>
  }

  function renderTopic() {
    if (!selectedTopic) return <EmptyState title="No topic selected" detail="Choose a topic from the roadmap." />

    function toggleSubtopic(key) {
      setOpenSubtopics((current) => {
        const next = new Set(current)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    }

    const filteredProblems = topicProblems.items.filter((problem) => {
      const statusMatches = topicStatusFilter === 'all' || (topicStatusFilter === 'solved' ? problem.status === 'solved' : problem.status !== 'solved')
      const difficultyMatches = topicDifficultyFilter === 'all' || problem.difficulty === topicDifficultyFilter
      return statusMatches && difficultyMatches
    })
    const grouped = filteredProblems.reduce((groups, problem) => {
      const key = problem.subtopic?.id || problem.subtopic?.name || 'other'
      if (!groups[key]) groups[key] = { name: problem.subtopic?.name || 'Problems', items: [] }
      groups[key].items.push(problem)
      return groups
    }, {})

    return <>
      <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><Breadcrumbs items={[{ label: 'dashboard', onClick: () => handleNavigate('dashboard') }, { label: 'DSA Roadmap', onClick: () => handleNavigate('roadmap') }, { label: selectedTopic.name }]} /><h1 className="text-[2rem] font-semibold leading-tight tracking-tight sm:text-[2.25rem]">{selectedTopic.name}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{selectedTopic.solved || 0} of {selectedTopic.total || 0} problems solved</p></div>
          <div className="w-full max-w-md lg:pb-1"><div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400"><span>Progress</span><span>{Math.round(selectedTopic.completion_percentage || 0)}%</span></div><ProgressBar value={selectedTopic.completion_percentage || 0} /></div>
        </div>
      </div>
      {!topicProblems.loading && !topicProblems.error && topicProblems.items.length > 0 && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Showing {filteredProblems.length} of {topicProblems.items.length} problems</p>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><span className="sr-only">Problem status</span><select value={topicStatusFilter} onChange={(event) => setTopicStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><option value="all">All problems</option><option value="solved">Solved</option><option value="unsolved">Unsolved</option></select></label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><span className="sr-only">Difficulty</span><select value={topicDifficultyFilter} onChange={(event) => setTopicDifficultyFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><option value="all">Difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
        </div>
      </div>}
      {topicProblems.loading ? <LoadingState /> : topicProblems.error ? <ErrorState message={topicProblems.error} onRetry={() => loadTopicProblems(selectedTopic)} /> : filteredProblems.length ? <div className="space-y-3">{Object.entries(grouped).map(([key, group]) => { const isOpen = openSubtopics.has(key); const fullGroupItems = topicProblems.items.filter((problem) => String(problem.subtopic?.id || problem.subtopic?.name || 'other') === String(key)); const groupSolved = fullGroupItems.filter((problem) => problem.status === 'solved').length; const groupProgress = fullGroupItems.length ? Math.round((groupSolved / fullGroupItems.length) * 100) : 0; return <section key={key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby={`subtopic-${key}`}><button type="button" onClick={() => toggleSubtopic(key)} aria-expanded={isOpen} className="w-full cursor-pointer px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"><div className="flex items-center gap-4"><div className="min-w-0 flex-1"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 id={`subtopic-${key}`} className="min-w-0 text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">{group.name}</h2><div className="flex shrink-0 items-center gap-3"><div className="w-28 sm:w-36"><div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400"><span>{groupSolved}/{fullGroupItems.length} solved</span><span>{groupProgress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${groupProgress}%` }} /></div></div><span className="hidden text-xs text-slate-500 dark:text-slate-400 md:inline">{group.items.length} {group.items.length === 1 ? 'problem' : 'problems'}</span></div></div></div><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-transform dark:border-slate-700 dark:text-slate-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span></div></button>{isOpen ? <div className="border-t border-slate-200 p-3 dark:border-slate-800 sm:p-4"><ProblemList problems={group.items} onStatusChange={handleStatusChange} onBookmarkChange={handleBookmarkChange} onRevisionChange={handleRevisionChange} onProblemUpdate={handleProblemUpdate} /></div> : null}</section>})}</div> : <EmptyState title="No problems match these filters" detail="Try All problems or change the selected filters." />}
    </>
  }

  function renderCollection(name, title, detail) {
    const collection = collections[name]
    const filtered = collection.items.filter((problem) => {
      const statusMatches = collectionStatusFilter === 'all' || (collectionStatusFilter === 'solved' ? problem.status === 'solved' : problem.status !== 'solved')
      const difficultyMatches = collectionDifficultyFilter === 'all' || problem.difficulty === collectionDifficultyFilter
      return statusMatches && difficultyMatches
    })
    return <>
      <Breadcrumbs items={[{ label: 'dashboard', onClick: () => handleNavigate('dashboard') }, { label: title }]} />
      <div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title} problems</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{detail}</p></div>
      {!collection.loading && !collection.error && collection.items.length > 0 && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Showing {filtered.length} of {collection.items.length} problems</p><div className="flex flex-wrap gap-2"><select value={collectionStatusFilter} onChange={(event) => setCollectionStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><option value="all">All problems</option><option value="solved">Solved</option><option value="unsolved">Unsolved</option></select><select value={collectionDifficultyFilter} onChange={(event) => setCollectionDifficultyFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><option value="all">Difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div></div>}
      {collection.loading ? <LoadingState /> : collection.error ? <ErrorState message={collection.error} onRetry={() => loadCollection(name)} /> : filtered.length ? <ProblemList problems={name === 'bookmarks' ? filtered.map((problem) => ({ ...problem, bookmarked: true })) : filtered} onStatusChange={handleStatusChange} onBookmarkChange={handleBookmarkChange} onRevisionChange={handleRevisionChange} onProblemUpdate={handleProblemUpdate} /> : <EmptyState title={`No ${name} problems match these filters`} detail="Try All problems or change the selected filters." />}
    </>
  }

  const content = view === 'dashboard' ? renderDashboard() : view === 'roadmap' ? renderRoadmap() : view === 'topic' ? renderTopic() : view === 'practice' ? <><Breadcrumbs items={[{ label: 'dashboard', onClick: () => handleNavigate('dashboard') }, { label: 'Practice' }]} /><PracticePage onStatusChange={handleStatusChange} /></> : view === 'streaks' ? <><Breadcrumbs items={[{ label: 'dashboard', onClick: () => handleNavigate('dashboard') }, { label: 'Streaks' }]} /><StreakPage /></> : renderCollection(view, view === 'revision' ? 'Revision' : 'Bookmarks', view === 'revision' ? 'Revisit these problems when you are ready.' : 'Your saved problems in one place.')

  return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-[#101010] dark:text-slate-100"><Sidebar activeView={view === 'topic' ? 'roadmap' : view} onNavigate={handleNavigate} isDark={isDark} onThemeToggle={() => setIsDark((current) => !current)} /><div className="flex min-h-screen flex-1 flex-col lg:pl-64"><main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-20 sm:px-6 sm:pt-20 lg:px-8 lg:py-8">{content}</main><footer className="mx-auto w-full max-w-7xl border-t border-slate-200 px-4 py-5 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:px-6 lg:px-8">© {new Date().getFullYear()} Ashutosh Mishra · DSA Practice Tracker · All rights reserved.</footer></div></div>
}

export default App
