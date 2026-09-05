import { useEffect, useState } from 'react'
import { api } from '../api'

const MAX_NOTE_LENGTH = 5000

function NoteModal({ problem, onClose }) {
  const [note, setNote] = useState('')
  const [originalNote, setOriginalNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      setSaved(false)
      try {
        const result = await api.getNote(problem.id)
        if (!cancelled) {
          const content = result?.content || ''
          setNote(content)
          setOriginalNote(content)
          setEditing(!content.trim())
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load note.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [problem.id])

  async function save() {
    if (note.length > MAX_NOTE_LENGTH) {
      setError(`Note must be ${MAX_NOTE_LENGTH.toLocaleString()} characters or fewer.`)
      return
    }
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await api.saveNote(problem.id, note)
      setOriginalNote(note)
      setSaved(true)
      setEditing(false)
    } catch (saveError) {
      setError(saveError.message || 'Unable to save note.')
    } finally {
      setSaving(false)
    }
  }

  const hasExistingNote = originalNote.trim().length > 0

  function startEditing() {
    setEditing(true)
    setSaved(false)
    setError('')
  }

  function cancelEditing() {
    setNote(originalNote)
    setEditing(false)
    setSaved(false)
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="note-modal-title" className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#3a3a3a] dark:bg-[#171717]">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-[#303030]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">Notes</p>
            <h2 id="note-modal-title" className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{problem.title}</h2>
          </div>
          <button type="button" title="Close notes" aria-label="Close notes" onClick={onClose} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-[#3a3a3a] dark:text-slate-300 dark:hover:bg-[#242424] dark:hover:text-white">×</button>
        </div>
        <div className="p-5">
          {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading note…</p> : <textarea autoFocus={editing} readOnly={!editing} value={note} maxLength={MAX_NOTE_LENGTH} onChange={(event) => { setNote(event.target.value); setSaved(false); setError('') }} placeholder="Write your notes for this problem…" rows={9} className={`w-full resize-y rounded-xl border px-4 py-3 text-sm leading-6 outline-none ${editing ? 'border-slate-200 bg-white text-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-[#3a3a3a] dark:bg-[#111111] dark:text-slate-100 dark:placeholder:text-slate-500' : 'cursor-default border-slate-200 bg-slate-50 text-slate-700 dark:border-[#333333] dark:bg-[#141414] dark:text-slate-300'}`} />}
          {editing ? <div className="mt-2 flex justify-end"><span className={`text-xs ${note.length >= MAX_NOTE_LENGTH ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{note.length.toLocaleString()} / {MAX_NOTE_LENGTH.toLocaleString()}</span></div> : null}
          {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
          {saved ? <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">Note saved successfully.</p> : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 dark:border-[#303030]">
          <span className="text-xs text-slate-500 dark:text-slate-400">{hasExistingNote ? 'Existing note' : 'No note yet'}</span>
          <div className="flex gap-2">
            {hasExistingNote && editing ? <button type="button" onClick={cancelEditing} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-[#3a3a3a] dark:text-slate-300 dark:hover:bg-[#242424]">Cancel edit</button> : null}
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-[#3a3a3a] dark:text-slate-300 dark:hover:bg-[#242424]">Cancel</button>
            {hasExistingNote && !editing ? <button type="button" onClick={startEditing} disabled={loading || saving} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">Update Note</button> : <button type="button" onClick={save} disabled={loading || saving} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : hasExistingNote ? 'Save Update' : 'Add New Note'}</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoteModal
