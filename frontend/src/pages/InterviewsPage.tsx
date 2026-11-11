import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, BriefcaseBusiness, CalendarDays, ListFilter, Plus, RefreshCw, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/apiError'
import { interviewService } from '../api/interviewService'
import { questionService } from '../api/questionService'
import type { Difficulty, Interview, InterviewStatus, InterviewType } from '../api/types'
import InterviewBadge from '../components/ui/InterviewBadge'
import PageHeader from '../components/ui/PageHeader'

type QuestionAvailability = { count: number; completed: number; percent: number; status: InterviewStatus; error: boolean }

const INTERVIEW_TYPES: { value: InterviewType | ''; label: string }[] = [
  { value: '', label: 'All interview types' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'SYSTEM_DESIGN', label: 'System design' },
]

const DIFFICULTIES: { value: Difficulty | ''; label: string }[] = [
  { value: '', label: 'All difficulties' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
]

function formatCreatedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Unable to load interviews. Please try again.'
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [questionAvailability, setQuestionAvailability] = useState<Record<number, QuestionAvailability>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<InterviewType | ''>('')
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | ''>('')

  const loadInterviews = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      const results = await interviewService.getInterviews()
      setInterviews(results)

      // The session DTO omits question progress; the practice endpoint provides it in one response per session.
      const questionResults = await Promise.allSettled(results.map((interview) => questionService.getPracticeSession(interview.id)))
      const availability: Record<number, QuestionAvailability> = {}
      questionResults.forEach((result, index) => {
        const interview = results[index]
        if (result.status === 'fulfilled') {
          availability[interview.id] = {
            count: result.value.progress.totalQuestions,
            completed: result.value.progress.completedQuestions,
            percent: result.value.progress.progressPercent,
            status: result.value.progress.status,
            error: false,
          }
        } else availability[interview.id] = { count: 0, completed: 0, percent: 0, status: interview.status, error: true }
      })
      setQuestionAvailability(availability)
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadInterviews()
  }, [loadInterviews])

  const filteredInterviews = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return interviews.filter((interview) => {
      const matchesSearch = !normalizedSearch
        || interview.role.toLocaleLowerCase().includes(normalizedSearch)
        || interview.topic.toLocaleLowerCase().includes(normalizedSearch)
      return matchesSearch
        && (!typeFilter || interview.interviewType === typeFilter)
        && (!difficultyFilter || interview.difficulty === difficultyFilter)
    })
  }, [difficultyFilter, interviews, search, typeFilter])

  const hasActiveFilters = Boolean(search || typeFilter || difficultyFilter)
  const clearFilters = () => {
    setSearch('')
    setTypeFilter('')
    setDifficultyFilter('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Your workspace"
        title="My Interviews"
        description="Browse your practice sessions and see which ones have AI-generated questions ready."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadInterviews(true)}
              disabled={isLoading || isRefreshing}
              aria-label="Refresh interviews"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link to="/interviews/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-brand-700">
              <Plus size={17} /> Create interview
            </Link>
          </div>
        }
      />

      {error && interviews.length > 0 && (
        <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <p>{error} Showing the last successfully loaded interviews.</p>
          <button type="button" onClick={() => void loadInterviews(true)} className="shrink-0 font-semibold underline underline-offset-2">Try again</button>
        </div>
      )}

      <section aria-label="Search and filter interviews" className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.02)] sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_200px_200px]">
          <label className="relative block">
            <span className="sr-only">Search by role or topic</span>
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by role or topic"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Filter by interview type</span>
            <ListFilter size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as InterviewType | '')} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-indigo-100">
              {INTERVIEW_TYPES.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="relative block">
            <span className="sr-only">Filter by difficulty</span>
            <ListFilter size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as Difficulty | '')} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-indigo-100">
              {DIFFICULTIES.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>{isLoading ? 'Loading interviews…' : `${filteredInterviews.length} ${filteredInterviews.length === 1 ? 'interview' : 'interviews'}`}</span>
          {hasActiveFilters && <button type="button" onClick={clearFilters} className="font-semibold text-brand-600 hover:text-brand-700">Clear filters</button>}
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2" role="status" aria-label="Loading interviews" aria-busy="true">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
        </div>
      ) : error && interviews.length === 0 ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center">
          <div className="mx-auto grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600"><AlertCircle size={19} /></div>
          <h2 className="mt-4 text-sm font-bold text-slate-900">We couldn’t load your interviews</h2>
          <p role="alert" className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-500">{error}</p>
          <button type="button" onClick={() => void loadInterviews(true)} disabled={isRefreshing} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"><RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> Try again</button>
        </section>
      ) : interviews.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><BriefcaseBusiness size={21} /></span>
          <h2 className="mt-4 text-sm font-bold text-slate-900">Your interviews will appear here</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">Create a practice interview to organize your preparation by role and focus area.</p>
          <Link to="/interviews/new" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700">Create your first interview <Plus size={15} /></Link>
        </section>
      ) : filteredInterviews.length === 0 ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center">
          <div className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500"><Search size={18} /></div>
          <h2 className="mt-4 text-sm font-bold text-slate-900">No matching interviews</h2>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">Try another search or adjust your filters.</p>
          <button type="button" onClick={clearFilters} className="mt-4 text-xs font-semibold text-brand-600 hover:text-brand-700">Clear search and filters</button>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredInterviews.map((interview) => {
            const availability = questionAvailability[interview.id]
            const count = availability?.count ?? 0
            return (
              <article key={interview.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.02)] transition hover:border-indigo-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold tracking-tight text-slate-900">{interview.role}</h2>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500"><Sparkles size={14} className="shrink-0 text-brand-500" /><span className="truncate">{interview.topic}</span></p>
                  </div>
                  {availability?.error ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100" title="Question availability could not be checked">Count unavailable</span>
                  ) : count > 0 ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100"><Sparkles size={12} /> Questions Ready</span>
                  ) : (
                    <span className="inline-flex shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">No Questions Yet</span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <InterviewBadge kind="type" value={interview.interviewType} />
                  <InterviewBadge kind="difficulty" value={interview.difficulty} />
                  <InterviewBadge kind="status" value={availability?.status ?? interview.status} />
                </div>

                {!availability?.error && count > 0 && (
                  <div className="mt-4" aria-label={`${availability.completed} of ${count} questions practiced`}>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500"><span>Practice progress</span><span>{availability.completed}/{count} completed</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-[width]" style={{ width: `${availability.percent}%` }} /></div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness size={14} className="text-slate-400" />{availability?.error ? 'Question count unavailable' : `${count} ${count === 1 ? 'question' : 'questions'}`}</span>
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-400" />{formatCreatedDate(interview.createdAt)}</span>
                  </div>
                  <Link to={`/interviews/${interview.id}`} className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-50 px-3.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 focus:outline-none focus:ring-4 focus:ring-indigo-100">View details</Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
