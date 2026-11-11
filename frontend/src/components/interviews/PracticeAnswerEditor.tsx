import { Check, LoaderCircle, Save } from 'lucide-react'

type PracticeAnswerEditorProps = {
  value: string
  savedValue: string
  saving: boolean
  busy: boolean
  saved: boolean
  error: string | null
  onChange: (value: string) => void
  onSave: () => void
}

export default function PracticeAnswerEditor({ value, savedValue, saving, busy, saved, error, onChange, onSave }: PracticeAnswerEditorProps) {
  const dirty = value !== savedValue

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="my-answer-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="my-answer-heading" className="text-sm font-bold text-slate-900">My practice answer</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Write your response in your own words. Your draft stays here as you move between questions.</p>
        </div>
        <span role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${dirty ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {dirty ? 'Unsaved changes' : saved ? <><Check size={12} /> Saved</> : savedValue ? 'Saved' : 'Not saved yet'}
        </span>
      </div>
      <label htmlFor="practice-answer" className="sr-only">Write your practice answer</label>
      <textarea id="practice-answer" value={value} onChange={(event) => onChange(event.target.value)} rows={8} maxLength={10000} disabled={saving}
        placeholder="Structure your answer, include examples, and note the points you want to remember…"
        className="mt-4 min-h-48 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400">{value.length.toLocaleString()} / 10,000 characters</span>
        <button type="button" onClick={onSave} disabled={busy || !dirty || !value.trim()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? <LoaderCircle size={15} className="animate-spin" /> : saved && !dirty ? <Check size={15} /> : <Save size={15} />}
          {saving ? 'Saving…' : saved && !dirty ? 'Saved' : 'Save answer'}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">{error}</p>}
    </section>
  )
}
