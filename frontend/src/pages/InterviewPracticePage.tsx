import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Circle, LoaderCircle, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/apiError'
import { interviewService } from '../api/interviewService'
import { questionService } from '../api/questionService'
import type { GeneratedQuestion, Interview, InterviewPractice } from '../api/types'
import DeleteInterviewDialog from '../components/interviews/DeleteInterviewDialog'
import InterviewEditDialog from '../components/interviews/InterviewEditDialog'
import PracticeAnswerEditor from '../components/interviews/PracticeAnswerEditor'
import SuggestedAnswerPanel from '../components/interviews/SuggestedAnswerPanel'
import InterviewBadge from '../components/ui/InterviewBadge'
import PageHeader from '../components/ui/PageHeader'

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError || error instanceof Error ? error.message : fallback
}

function generationErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'The AI service is receiving too many requests. Wait a moment, then try again.'
    if (error.kind === 'timeout' || error.status === 408) return 'Question generation took longer than expected. You can try again in a moment.'
  }
  return errorMessage(error, 'Unable to generate questions. Please try again.')
}

function formatCreatedDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function practiceError(error: unknown) {
  if (error instanceof ApiError && error.status === 404) return 'This interview session could not be found. It may have been deleted.'
  return errorMessage(error, 'Unable to load this practice session.')
}

function recomputePractice(practice: InterviewPractice, questions: GeneratedQuestion[]): InterviewPractice {
  const totalQuestions = questions.length
  const answeredQuestions = questions.filter((question) => question.practiceAnswer !== null).length
  const completedQuestions = questions.filter((question) => question.completedAt !== null).length
  const status = totalQuestions === 0 ? 'CREATED'
    : completedQuestions === totalQuestions ? 'COMPLETED'
      : answeredQuestions > 0 || completedQuestions > 0 ? 'IN_PROGRESS' : 'QUESTIONS_GENERATED'
  return {
    ...practice,
    session: { ...practice.session, status },
    questions,
    progress: {
      status,
      totalQuestions,
      answeredQuestions,
      completedQuestions,
      progressPercent: totalQuestions ? Math.floor((completedQuestions * 100) / totalQuestions) : 0,
    },
  }
}

export default function InterviewPracticePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const interviewId = Number(id)
  const validId = Number.isSafeInteger(interviewId) && interviewId > 0
  const [practice, setPractice] = useState<InterviewPractice | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const savingLock = useRef(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [answerErrors, setAnswerErrors] = useState<Record<number, string>>({})
  const [completingId, setCompletingId] = useState<number | null>(null)
  const completingLock = useRef(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [generationCount, setGenerationCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const generationLock = useRef(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generationNotice, setGenerationNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sessionActionError, setSessionActionError] = useState<string | null>(null)
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)

  const refreshPractice = useCallback(async (showLoading = false) => {
    if (!validId) {
      setLoadError('The interview ID is invalid.')
      setLoading(false)
      return null
    }
    if (showLoading) setLoading(true)
    if (showLoading) setLoadError(null)
    try {
      const result = await questionService.getPracticeSession(interviewId)
      const ordered = [...result.questions].sort((a, b) => a.questionOrder - b.questionOrder)
      const next = { ...result, questions: ordered }
      setPractice(next)
      setSelectedId((current) => current && ordered.some((question) => question.id === current) ? current : ordered[0]?.id ?? null)
      return next
    } catch (error) {
      if (showLoading) setLoadError(practiceError(error))
      return null
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [interviewId, validId])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    if (!validId) {
      setLoadError('The interview ID is invalid.')
      setLoading(false)
      return () => { active = false }
    }
    questionService.getPracticeSession(interviewId)
      .then((result) => {
        if (!active) return
        const ordered = [...result.questions].sort((a, b) => a.questionOrder - b.questionOrder)
        setPractice({ ...result, questions: ordered })
        setSelectedId((current) => current && ordered.some((question) => question.id === current) ? current : ordered[0]?.id ?? null)
      })
      .catch((error: unknown) => { if (active) setLoadError(practiceError(error)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, interviewId, validId, retryKey])

  const questions = practice?.questions ?? []
  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedId) ?? questions[0] ?? null,
    [questions, selectedId],
  )
  const selectedIndex = selectedQuestion ? questions.findIndex((question) => question.id === selectedQuestion.id) : -1
  const answerValue = selectedQuestion ? drafts[selectedQuestion.id] ?? selectedQuestion.practiceAnswer ?? '' : ''
  const savedAnswer = selectedQuestion?.practiceAnswer ?? ''
  const progress = practice?.progress
  const isComplete = Boolean(progress && progress.totalQuestions > 0 && progress.completedQuestions === progress.totalQuestions)

  const handleGenerate = async () => {
    if (generationLock.current || !validId) return
    generationLock.current = true
    setGenerating(true)
    setGenerationError(null)
    setGenerationNotice(null)
    try {
      const result = await questionService.generateQuestions(interviewId, { numberOfQuestions: generationCount })
      const knownIds = new Set(practice?.questions.map((question) => question.id) ?? [])
      const added = result.questions.filter((question) => !knownIds.has(question.id))
      setPractice((current) => {
        if (!current) return current
        if (!added.length) return current
        const questions = [...current.questions, ...added].sort((a, b) => a.questionOrder - b.questionOrder)
        return recomputePractice(current, questions)
      })
      if (added.length) setSelectedId(added[0].id)
      const refreshed = await refreshPractice()
      if (refreshed) setGenerationNotice(`${result.questions.length} ${result.questions.length === 1 ? 'question' : 'questions'} generated successfully.`)
      else setGenerationNotice('Questions were generated, but the updated list could not be loaded. Use refresh to try again.')
    } catch (error) {
      setGenerationError(generationErrorMessage(error))
    } finally {
      generationLock.current = false
      setGenerating(false)
    }
  }

  const handleSaveAnswer = async () => {
    if (!selectedQuestion || savingLock.current || !answerValue.trim()) return
    const questionId = selectedQuestion.id
    savingLock.current = true
    setSavingId(questionId)
    setSavedId(null)
    setAnswerErrors((current) => ({ ...current, [questionId]: '' }))
    try {
      const response = await questionService.savePracticeAnswer(interviewId, questionId, answerValue)
      setDrafts((current) => ({ ...current, [questionId]: response.answerText ?? '' }))
      setPractice((current) => current ? recomputePractice(current, current.questions.map((question) => question.id === questionId
        ? { ...question, practiceAnswer: response.answerText, practiceAnswerUpdatedAt: response.updatedAt, completedAt: response.completedAt }
        : question)) : current)
      setSavedId(questionId)
      const refreshed = await refreshPractice()
      if (!refreshed) setAnswerErrors((current) => ({ ...current, [questionId]: 'Answer saved, but progress could not be refreshed. Retry the page when you are online.' }))
    } catch (error) {
      setAnswerErrors((current) => ({ ...current, [questionId]: errorMessage(error, 'Unable to save your answer. Please try again.') }))
    } finally {
      savingLock.current = false
      setSavingId(null)
    }
  }

  const handleMarkCompleted = async () => {
    if (!selectedQuestion || completingLock.current) return
    const questionId = selectedQuestion.id
    completingLock.current = true
    setCompletingId(questionId)
    setCompleteError(null)
    try {
      const response = await questionService.markQuestionCompleted(interviewId, questionId)
      setPractice((current) => current ? recomputePractice(current, current.questions.map((question) => question.id === questionId
        ? { ...question, practiceAnswer: response.answerText, practiceAnswerUpdatedAt: response.updatedAt, completedAt: response.completedAt }
        : question)) : current)
      const refreshed = await refreshPractice()
      if (!refreshed) setCompleteError('Question marked practiced, but progress could not be refreshed.')
    } catch (error) {
      setCompleteError(errorMessage(error, 'Unable to update practice progress. Please try again.'))
    } finally {
      completingLock.current = false
      setCompletingId(null)
    }
  }

  const handleDelete = async () => {
    if (!practice) return
    setSessionActionError(null)
    setDeleting(true)
    try {
      await interviewService.deleteInterview(practice.session.id)
      navigate('/', { replace: true })
    } catch (error) {
      setSessionActionError(errorMessage(error, 'Unable to delete this interview. Please try again.'))
      setDeleting(false)
    }
  }

  if (loading) return <div className="space-y-5" role="status" aria-label="Loading interview practice"><div className="h-28 animate-pulse rounded-2xl bg-white" /><div className="h-64 animate-pulse rounded-2xl bg-white" /><div className="h-72 animate-pulse rounded-2xl bg-white" /></div>

  if (loadError || !practice) {
    const notFound = !validId || loadError?.includes('could not be found')
    return <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
      <h1 className="text-lg font-bold text-slate-900">{notFound ? 'Interview not found' : 'Practice session unavailable'}</h1>
      <p role="alert" className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{loadError ?? 'This interview could not be loaded.'}</p>
      <div className="mt-5 flex justify-center gap-3">
        {!notFound && <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"><RefreshCw size={15} /> Try again</button>}
        <Link to="/interviews" className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">My interviews</Link>
      </div>
    </section>
  }

  const session: Interview = practice.session
  return <>
    <Link to="/interviews" className="mb-5 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back to interviews</Link>
    <PageHeader eyebrow="Interview practice" title={session.role} description={`${session.topic} · Created ${formatCreatedDate(session.createdAt)}`}
      action={<div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { setSessionActionError(null); setSessionNotice(null); setEditing(true) }} className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
        <button type="button" onClick={() => { setSessionActionError(null); setDeleteOpen(true) }} disabled={deleting} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"><Trash2 size={14} /> Delete</button>
      </div>} />

    {sessionNotice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{sessionNotice}</p>}
    {sessionActionError && !deleteOpen && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{sessionActionError}</p>}

    <section className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.02)] sm:p-6" aria-labelledby="overview-heading">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="overview-heading" className="text-sm font-bold text-slate-900">Interview overview</h2><p className="mt-1 text-xs text-slate-500">Your session and practice progress</p></div><InterviewBadge kind="status" value={progress?.status ?? session.status} /></div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3"><div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Difficulty</dt><dd className="mt-1.5"><InterviewBadge kind="difficulty" value={session.difficulty} /></dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Interview type</dt><dd className="mt-1.5"><InterviewBadge kind="type" value={session.interviewType} /></dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Topic</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{session.topic}</dd></div></dl>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold text-slate-700">{progress?.completedQuestions ?? 0} of {progress?.totalQuestions ?? questions.length} questions completed</span><span className="text-slate-500">{progress?.progressPercent ?? 0}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Interview practice progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress?.progressPercent ?? 0}><div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progress?.progressPercent ?? 0}%` }} /></div>
        {isComplete && <p role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700"><Check size={16} /> You’ve completed every question in this interview. Great work!</p>}
      </div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.02)]" aria-labelledby="practice-heading">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><h2 id="practice-heading" className="text-sm font-bold text-slate-900">Practice questions</h2><p className="mt-1 text-xs text-slate-500">Study the suggested answer, then write and save your own response.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="practice-generation-count" className="sr-only">Number of questions to generate</label>
          <select id="practice-generation-count" value={generationCount} onChange={(event) => setGenerationCount(Number(event.target.value))} disabled={generating} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'question' : 'questions'}</option>)}
          </select>
          <button type="button" onClick={() => void handleGenerate()} disabled={generating} aria-busy={generating} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
            {generating ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}{generating ? 'Generating…' : questions.length ? 'Generate more' : 'Generate Questions'}
          </button>
        </div>
      </div>
      {generationError && <p role="alert" className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-6">{generationError}</p>}
      {generationNotice && <p role="status" className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:mx-6">{generationNotice}</p>}
      {questions.length === 0 ? <div className="px-5 py-12 text-center sm:px-7"><div className="mx-auto grid size-11 place-items-center rounded-xl bg-indigo-50 text-brand-600"><Plus size={19} /></div><h3 className="mt-4 text-sm font-bold text-slate-900">No questions yet</h3><p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">Generate tailored questions and suggested answers for this interview to begin practicing.</p></div> : (
        <div className="grid min-w-0 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label="Question navigation" className="border-b border-slate-100 p-3 lg:border-b-0 lg:border-r lg:p-4">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Questions · {questions.length}</p>
            <ol className="flex gap-2 overflow-x-auto pb-1 lg:max-h-[calc(100vh-22rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
              {questions.map((question, index) => {
                const active = selectedQuestion?.id === question.id
                const completed = Boolean(question.completedAt)
                return <li key={question.id} className="shrink-0 lg:shrink">
                  <button type="button" onClick={() => { setSelectedId(question.id); setCompleteError(null) }} aria-pressed={active}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${active ? 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {completed ? <Check size={15} className="shrink-0 text-emerald-600" aria-label="Practiced" /> : <Circle size={13} className="shrink-0 text-slate-300" aria-hidden="true" />}
                    <span className="text-[11px] font-bold tabular-nums">{String(question.questionOrder || index + 1).padStart(2, '0')}</span>
                    <span className="hidden min-w-0 truncate text-xs font-medium lg:inline">{question.questionText}</span>
                    <span className="sr-only lg:hidden">{question.questionText}</span>
                    <span className="sr-only">{completed ? 'Practiced' : 'Not practiced'}</span>
                  </button>
                </li>
              })}
            </ol>
          </nav>

          {selectedQuestion && <div className="min-w-0 space-y-4 p-4 sm:p-6">
            <article aria-labelledby="selected-question-heading" className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">Question {selectedQuestion.questionOrder || selectedIndex + 1}</span><InterviewBadge kind="difficulty" value={selectedQuestion.difficulty} /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{selectedQuestion.topic}</span></div>{selectedQuestion.completedAt && <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"><Check size={14} /> Practiced</span>}</div>
              <div className="p-4 sm:p-5"><h3 id="selected-question-heading" className="text-base font-bold leading-7 text-slate-900 sm:text-lg">{selectedQuestion.questionText}</h3>
                {(selectedQuestion.evaluationCriteria.length > 0 || selectedQuestion.expectedKeyConcepts.length > 0) && <details className="mt-4 rounded-xl bg-slate-50 px-4 py-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Review evaluation criteria and key concepts</summary><div className="mt-3 grid gap-4 sm:grid-cols-2">{selectedQuestion.evaluationCriteria.length > 0 && <div><h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Evaluation criteria</h4><ul className="mt-2 space-y-1.5">{selectedQuestion.evaluationCriteria.map((item) => <li key={item} className="text-xs leading-5 text-slate-600">• {item}</li>)}</ul></div>}{selectedQuestion.expectedKeyConcepts.length > 0 && <div><h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Expected key concepts</h4><ul className="mt-2 space-y-1.5">{selectedQuestion.expectedKeyConcepts.map((item) => <li key={item} className="text-xs leading-5 text-slate-600">• {item}</li>)}</ul></div>}</div></details>}
              </div>
            </article>

            <SuggestedAnswerPanel answer={selectedQuestion.suggestedAnswer} />
            <PracticeAnswerEditor value={answerValue} savedValue={savedAnswer} saving={savingId === selectedQuestion.id} busy={savingId !== null} saved={savedId === selectedQuestion.id} error={answerErrors[selectedQuestion.id] || null}
              onChange={(value) => { setDrafts((current) => ({ ...current, [selectedQuestion.id]: value })); setSavedId(null); setAnswerErrors((current) => ({ ...current, [selectedQuestion.id]: '' })) }} onSave={() => void handleSaveAnswer()} />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setSelectedId(questions[Math.max(0, selectedIndex - 1)]?.id ?? null)} disabled={selectedIndex <= 0} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={15} /> Previous</button>
              <div className="flex flex-wrap items-center gap-2">
                {completeError && <p role="alert" className="w-full text-right text-xs text-rose-700">{completeError}</p>}
                {!selectedQuestion.completedAt && <button type="button" onClick={() => void handleMarkCompleted()} disabled={completingId === selectedQuestion.id || savingId === selectedQuestion.id} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60">{completingId === selectedQuestion.id ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Mark as practiced</button>}
                <button type="button" onClick={() => setSelectedId(questions[Math.min(questions.length - 1, selectedIndex + 1)]?.id ?? null)} disabled={selectedIndex >= questions.length - 1} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight size={15} /></button>
              </div>
            </div>
          </div>}
        </div>
      )}
    </section>

    {editing && <InterviewEditDialog interview={session} onClose={() => setEditing(false)} onSaved={(updated) => { setPractice((current) => current ? { ...current, session: updated } : current); setEditing(false); setSessionNotice('Interview session updated successfully.') }} />}
    {deleteOpen && <DeleteInterviewDialog interviewRole={session.role} isDeleting={deleting} errorMessage={sessionActionError} onCancel={() => { if (!deleting) { setDeleteOpen(false); setSessionActionError(null) } }} onConfirm={() => void handleDelete()} />}
  </>
}

