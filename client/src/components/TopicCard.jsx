import ProgressBar from './ProgressBar'

function TopicCard({ name, solved = 0, total = 0, completion_percentage = 0, color = 'bg-violet-500' }) {
  const progress = Math.round(completion_percentage)
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#303030] dark:bg-[#171717]">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{name}</h3><span className="text-sm font-medium text-slate-500 dark:text-slate-400">{progress}%</span></div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{solved} of {total} problems solved</p>
      <ProgressBar value={progress} color={color} className="mt-5" />
    </article>
  )
}

export default TopicCard
