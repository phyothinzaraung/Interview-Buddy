import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Interview } from '../../api/types'
import InterviewBadge from '../ui/InterviewBadge'

type InterviewDetailsDialogProps = { interview: Interview; onClose: () => void }

function formatCreatedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(date)
}

export default function InterviewDetailsDialog({ interview, onClose }: InterviewDetailsDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="interview-details-title" className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600">Interview details</p><h2 id="interview-details-title" className="mt-2 text-lg font-bold tracking-tight text-slate-900">{interview.role}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close interview details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div><dt className="text-[11px] font-medium text-slate-400">Topic</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{interview.topic}</dd></div>
          <div><dt className="text-[11px] font-medium text-slate-400">Created</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatCreatedDate(interview.createdAt)}</dd></div>
          <div><dt className="text-[11px] font-medium text-slate-400">Interview type</dt><dd className="mt-1.5"><InterviewBadge kind="type" value={interview.interviewType} /></dd></div>
          <div><dt className="text-[11px] font-medium text-slate-400">Difficulty</dt><dd className="mt-1.5"><InterviewBadge kind="difficulty" value={interview.difficulty} /></dd></div>
          <div><dt className="text-[11px] font-medium text-slate-400">Status</dt><dd className="mt-1.5"><InterviewBadge kind="status" value={interview.status} /></dd></div>
        </dl>
        <div className="mt-7 flex justify-end"><button type="button" onClick={onClose} className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200">Close</button></div>
      </section>
    </div>
  )
}
