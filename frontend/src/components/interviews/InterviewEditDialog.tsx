import { useState } from 'react'
import { X } from 'lucide-react'
import { ApiError } from '../../api/apiError'
import { interviewService } from '../../api/interviewService'
import type { Interview, InterviewRequest } from '../../api/types'
import InterviewSessionForm from './InterviewSessionForm'

type InterviewEditDialogProps = {
  interview: Interview
  onClose: () => void
  onSaved: (interview: Interview) => void
}

export default function InterviewEditDialog({ interview, onClose, onSaved }: InterviewEditDialogProps) {
  const [apiError, setApiError] = useState<string | null>(null)

  const updateInterview = async (values: InterviewRequest) => {
    setApiError(null)
    try {
      onSaved(await interviewService.updateInterview(interview.id, values))
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : 'Unable to update this interview. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="edit-interview-title" className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600">Session settings</p><h2 id="edit-interview-title" className="mt-1 text-base font-bold text-slate-900">Edit interview</h2></div>
          <button type="button" onClick={onClose} aria-label="Close edit form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <InterviewSessionForm
          initialValues={{ role: interview.role, difficulty: interview.difficulty, interviewType: interview.interviewType, topic: interview.topic }}
          idPrefix="edit-interview"
          submitLabel="Save changes"
          submittingLabel="Saving changes…"
          errorMessage={apiError}
          onCancel={onClose}
          onSubmit={updateInterview}
        />
      </section>
    </div>
  )
}
