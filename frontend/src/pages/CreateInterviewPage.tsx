import { useState } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/apiError'
import { interviewService } from '../api/interviewService'
import type { InterviewRequest } from '../api/types'
import InterviewSessionForm from '../components/interviews/InterviewSessionForm'
import PageHeader from '../components/ui/PageHeader'

export default function CreateInterviewPage() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)

  const createInterview = async (values: InterviewRequest) => {
    setApiError(null)
    try {
      const interview = await interviewService.createInterview(values)
      navigate(`/interviews/${interview.id}`)
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : 'We could not create the interview. Please try again.')
    }
  }

  return (
    <>
      <Link to="/interviews" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back to interviews</Link>
      <PageHeader eyebrow="Get ready" title="Create an interview" description="Set up a focused practice session for the opportunity ahead." />
      <div className="mb-5 flex max-w-2xl items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 text-indigo-900">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white text-brand-600 shadow-sm"><Sparkles size={16} /></span>
        <div><p className="text-xs font-semibold">Make practice relevant</p><p className="mt-1 text-xs leading-5 text-indigo-800/80">Choose the role and topic you want to focus on. Your session will be ready for question generation next.</p></div>
      </div>
      <div className="max-w-2xl">
        <InterviewSessionForm
          idPrefix="create-interview"
          submitLabel="Create interview"
          submittingLabel="Creating interview…"
          errorMessage={apiError}
          onCancel={() => navigate('/interviews')}
          onSubmit={createInterview}
        />
      </div>
    </>
  )
}
