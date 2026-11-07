import { AlertTriangle, LoaderCircle, Trash2, X } from 'lucide-react'

type DeleteInterviewDialogProps = {
  interviewRole: string
  isDeleting: boolean
  errorMessage?: string | null
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteInterviewDialog({ interviewRole, isDeleting, errorMessage, onCancel, onConfirm }: DeleteInterviewDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-interview-title" aria-describedby="delete-interview-warning" className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={19} /></span>
          <button type="button" onClick={onCancel} disabled={isDeleting} aria-label="Close delete confirmation" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={18} /></button>
        </div>
        <h2 id="delete-interview-title" className="mt-4 text-base font-bold text-slate-900">Delete this interview?</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">{interviewRole}</p>
        <p id="delete-interview-warning" className="mt-3 text-xs leading-5 text-slate-500">
          Deleting this session also removes its associated questions through the backend cascade. Any associated answers may also be deleted depending on backend cascade behavior. This action cannot be undone.
        </p>
        {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-800">{errorMessage}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isDeleting} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isDeleting ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {isDeleting ? 'Deleting…' : 'Delete interview'}
          </button>
        </div>
      </section>
    </div>
  )
}
