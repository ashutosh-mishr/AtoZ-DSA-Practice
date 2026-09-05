function SignInPromptModal({ onClose, onNavigate }) {
  function go(next) {
    onClose()
    onNavigate(next)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="sign-in-prompt-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#3a3a3a] dark:bg-[#171717]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-xl text-violet-600 dark:text-violet-300">🔒</div>
            <h2 id="sign-in-prompt-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sign in to save your progress</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Create an account or sign in to track solved problems, bookmarks, revision, notes and streaks across devices.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-[#3a3a3a] dark:text-slate-300 dark:hover:bg-[#242424] dark:hover:text-white" aria-label="Close sign in prompt">×</button>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => go('login')} className="flex-1 cursor-pointer rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700">Sign in</button>
          <button type="button" onClick={() => go('register')} className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-200 dark:hover:bg-[#242424]">Register</button>
        </div>
        <button type="button" onClick={onClose} className="mt-3 w-full cursor-pointer py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">Maybe later</button>
      </div>
    </div>
  )
}

export default SignInPromptModal
