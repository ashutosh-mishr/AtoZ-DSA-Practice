function TopicTable({ topics, onSelectTopic }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">#</th>
              <th className="px-5 py-3 font-semibold">Topic</th>
              <th className="px-5 py-3 text-right font-semibold">Problems</th>
              <th className="px-5 py-3 text-right font-semibold">Solved</th>
              <th className="px-5 py-3 font-semibold">Progress</th>
              <th className="px-5 py-3 text-right font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {topics.map((topic, index) => {
              const progress = Math.round(topic.completion_percentage || 0)
              return (
                <tr key={topic.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-4 text-slate-400">{index + 1}</td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => onSelectTopic(topic)} className="cursor-pointer text-left font-semibold text-slate-900 hover:text-violet-600 dark:text-slate-100 dark:hover:text-violet-300">
                      {topic.name}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-slate-700 dark:text-slate-300">{topic.total}</td>
                  <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-400">{topic.solved}</td>
                  <td className="px-5 py-4">
                    <div className="flex min-w-40 items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button type="button" onClick={() => onSelectTopic(topic)} className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-violet-600 hover:border-violet-200 hover:bg-violet-50 dark:border-slate-700 dark:text-violet-300 dark:hover:border-violet-800 dark:hover:bg-violet-950/30">
                      View problems
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TopicTable
