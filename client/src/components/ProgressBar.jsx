function ProgressBar({ value, color = 'bg-violet-500', className = '' }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#242424] ${className}`} aria-label={`${value}% complete`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  )
}

export default ProgressBar
