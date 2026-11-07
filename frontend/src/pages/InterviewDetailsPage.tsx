import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, CalendarDays, LoaderCircle, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/apiError'
import { interviewService } from '../api/interviewService'
import { questionService } from '../api/questionService'
import type { GeneratedQuestion, Interview } from '../api/types'
import DeleteInterviewDialog from '../components/interviews/DeleteInterviewDialog'
import InterviewEditDialog from '../components/interviews/InterviewEditDialog'
import QuestionCard from '../components/interviews/QuestionCard'
import InterviewBadge from '../components/ui/InterviewBadge'
import PageHeader from '../components/ui/PageHeader'

function formatCreatedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(date)
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : error instanceof Error ? error.message : fallback
}

function getGenerationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'The AI service is receiving too many requests. Wait a moment, then try again.'
    if (error.kind === 'timeout' || error.status === 408) return 'Question generation took longer than expected. You can try again in a moment.'
    return error.message
  }
  return error instanceof Error ? error.message : 'Unable to generate questions. Please try again.'
}

export default function InterviewDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const interviewId = Number(id)
  const validId = Number.isSafeInteger(interviewId) && interviewId > 0

  const [interview, setInterview] = useState<Interview | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionRetry, setSessionRetry] = useState(0)

  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [questionsRetry, setQuestionsRetry] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const generationLock = useRef(false)
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function loadInterview() {
      setSessionLoading(true)
      setSessionError(null)
      if (!validId) {
        setSessionError('The interview ID is invalid.')
        setSessionLoading(false)
        return
      }

      try {
        const data = await interviewService.getInterviewById(interviewId)
        if (isCurrent) setInterview(data)
      } catch (error) {
        if (isCurrent) {
          setSessionError(error instanceof ApiError && error.status === 404
            ? 'This interview session could not be found. It may have been deleted.'
            : getErrorMessage(error, 'Unable to load this interview session.'))
        }
      } finally {
        if (isCurrent) setSessionLoading(false)
      }
    }

    void loadInterview()
    return () => { isCurrent = false }
  }, [id, interviewId, validId, sessionRetry])

  useEffect(() => {
    let isCurrent = true
    async function loadQuestions() {
      setQuestionsLoading(true)
      setQuestionsError(null)
      if (!validId) {
        setQuestionsLoading(false)
        return
      }
      try {
        const data = await questionService.getQuestions(interviewId)
        if (isCurrent) setQuestions(data)
      } catch (error) {
        if (isCurrent) setQuestionsError(getErrorMessage(error, 'Unable to load interview questions.'))
      } finally {
        if (isCurrent) setQuestionsLoading(false)
      }
    }
    void loadQuestions()
    return () => { isCurrent = false }
  }, [id, interviewId, validId, questionsRetry])

  const handleGenerateQuestions = async () => {
    if (generationLock.current || !validId) return
    generationLock.current = true
    setIsGenerating(true)
    setGenerationError(null)
    setGenerationSuccess(null)
    try {
      const result = await questionService.generateQuestions(interviewId, { numberOfQuestions })
      setQuestions((current) => {
        const existingIds = new Set(current.map((question) => question.id))
        return [...current, ...result.questions.filter((question) => !existingIds.has(question.id))]
      })
      setGenerationSuccess(`${result.questions.length} ${result.questions.length === 1 ? 'question' : 'questions'} generated successfully.`)

      try {
        const refreshedQuestions = await questionService.getQuestions(interviewId)
        setQuestions(refreshedQuestions)
        setQuestionsError(null)
      } catch (refreshError) {
        setQuestionsError(`Generated questions are shown, but the saved list could not be refreshed. ${getErrorMessage(refreshError, 'Please retry the question list.')}`)
      }
    } catch (error) {
      setGenerationError(getGenerationErrorMessage(error))
    } finally {
      generationLock.current = false
      setIsGenerating(false)
    }
  }

  const handleDelete = async () => {
    if (!interview) return
    setActionError(null)
    setIsDeleting(true)
    try {
      await interviewService.deleteInterview(interview.id)
      navigate('/', { replace: true })
    } catch (error) {
      setActionError(getErrorMessage(error, 'Unable to delete this interview. Please try again.'))
      setIsDeleting(false)
    }
  }

  if (sessionLoading) {
    return <div className="space-y-5" role="status" aria-label="Loading interview details"><div className="h-24 animate-pulse rounded-2xl bg-white" /><div className="h-48 animate-pulse rounded-2xl bg-white" /><div className="h-64 animate-pulse rounded-2xl bg-white" /></div>
  }

  if (sessionError || !interview) {
    const notFound = !validId || (sessionError?.includes('could not be found') ?? false)
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600"><BriefcaseBusiness size={19} /></div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">{notFound ? 'Interview not found' : 'Interview details unavailable'}</h1>
        <p role="alert" className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-500">{sessionError ?? 'This interview could not be found.'}</p>
        <div className="mt-5 flex justify-center gap-3">
          {!notFound && <button type="button" onClick={() => setSessionRetry((key) => key + 1)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><RefreshCw size={15} /> Try again</button>}
          <Link to="/interviews" className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">My interviews</Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <Link to="/interviews" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back to interviews</Link>
      <PageHeader
        eyebrow="Interview session"
        title={interview.role}
        description="Review this practice session and prepare with tailored questions."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setActionError(null); setSessionNotice(null); setIsEditing(true) }} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
            <button type="button" onClick={() => { setActionError(null); setIsDeleteDialogOpen(true) }} disabled={isDeleting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"><Trash2 size={14} />Delete</button>
          </div>
        }
      />

      {sessionNotice && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{sessionNotice}</div>}
      {actionError && !isDeleteDialogOpen && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{actionError}</div>}

      <section className="mb-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.02)] sm:p-7" aria-labelledby="session-details-heading">
        <div className="mb-5 flex items-center justify-between"><div><h2 id="session-details-heading" className="text-sm font-bold text-slate-900">Session details</h2><p className="mt-1 text-xs text-slate-500">Your interview setup</p></div><CalendarDays size={18} className="text-slate-400" /></div>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Job role</dt><dd className="mt-1.5 text-sm font-semibold text-slate-800">{interview.role}</dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Difficulty</dt><dd className="mt-1.5"><InterviewBadge kind="difficulty" value={interview.difficulty} /></dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Interview type</dt><dd className="mt-1.5"><InterviewBadge kind="type" value={interview.interviewType} /></dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Topic</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{interview.topic}</dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</dt><dd className="mt-1.5"><InterviewBadge kind="status" value={interview.status} /></dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Created</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{formatCreatedDate(interview.createdAt)}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.02)]" aria-labelledby="questions-heading">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div><h2 id="questions-heading" className="text-sm font-bold text-slate-900">Interview questions</h2><p className="mt-1 text-xs text-slate-500">Generated for this session</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="question-count" className="sr-only">Number of questions to generate</label>
            <select id="question-count" value={numberOfQuestions} onChange={(event) => setNumberOfQuestions(Number(event.target.value))} disabled={isGenerating || questionsLoading} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60">
              {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'question' : 'questions'}</option>)}
            </select>
            <button type="button" onClick={() => void handleGenerateQuestions()} disabled={isGenerating || questionsLoading} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-brand-600 px-3.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto" aria-busy={isGenerating}>
              {isGenerating ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
              {isGenerating ? 'Generating…' : 'Generate Questions'}
            </button>
          </div>
        </div>

        {generationError && <div role="alert" className="mx-5 mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-7">{generationError}</div>}
        {generationSuccess && <div role="status" className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:mx-7">{generationSuccess}</div>}
        {questionsError && questions.length > 0 && <div role="alert" className="mx-5 mt-5 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:mx-7 sm:flex-row sm:items-center sm:justify-between"><p>{questionsError}</p><button type="button" onClick={() => setQuestionsRetry((key) => key + 1)} className="shrink-0 font-semibold underline underline-offset-2">Refresh list</button></div>}

        {questionsLoading ? (
          <div className="space-y-3 p-5 sm:p-7" role="status" aria-label="Loading interview questions">{[0, 1].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : questionsError && questions.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-7"><p role="alert" className="text-sm text-slate-600">{questionsError}</p><button type="button" onClick={() => setQuestionsRetry((key) => key + 1)} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700"><RefreshCw size={14} /> Try again</button></div>
        ) : questions.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-7">
            <div className="mx-auto grid size-11 place-items-center rounded-xl bg-indigo-50 text-brand-600"><Plus size={19} /></div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">No questions yet</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">Generate a set of questions tailored to this session’s role and topic.</p>
          </div>
        ) : (
          <div className="space-y-4 p-5 sm:p-7">{questions.map((question, index) => <QuestionCard key={`${question.id}-${index}`} question={question} number={index + 1} />)}</div>
        )}
      </section>

      {isEditing && <InterviewEditDialog interview={interview} onClose={() => setIsEditing(false)} onSaved={(updated) => { setInterview(updated); setIsEditing(false); setSessionNotice('Interview session updated successfully.') }} />}
      {isDeleteDialogOpen && <DeleteInterviewDialog interviewRole={interview.role} isDeleting={isDeleting} errorMessage={actionError} onCancel={() => { if (!isDeleting) { setIsDeleteDialogOpen(false); setActionError(null) } }} onConfirm={() => void handleDelete()} />}
    </>
  )
}
