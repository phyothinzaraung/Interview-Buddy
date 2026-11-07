import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, BriefcaseBusiness, Code2, Plus, RefreshCw, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/apiError'
import { interviewService } from '../api/interviewService'
import type { Interview } from '../api/types'
import InterviewDetailsDialog from '../components/dashboard/InterviewDetailsDialog'
import SummaryCard from '../components/dashboard/SummaryCard'
import InterviewBadge from '../components/ui/InterviewBadge'
import PageHeader from '../components/ui/PageHeader'

const RECENT_WINDOW_DAYS = 7
const RECENT_INTERVIEW_LIMIT = 5

function formatCreatedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return error instanceof Error ? error.message : 'Unable to load interviews. Please try again.'
}

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)

  const loadInterviews = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      setInterviews(await interviewService.getInterviews())
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

  const sortedInterviews = useMemo(
    () => [...interviews].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [interviews],
  )
  const recentCount = interviews.filter((interview) => {
    const createdAt = Date.parse(interview.createdAt)
    return Number.isFinite(createdAt) && createdAt >= Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  }).length
  const recentInterviews = sortedInterviews.slice(0, RECENT_INTERVIEW_LIMIT)

  return (
    <>
      <PageHeader
        eyebrow="Your workspace"
        title="Dashboard"
        description="Track your interview practice and jump back into a recent session."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadInterviews(true)}
              disabled={isLoading || isRefreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Refresh interviews"
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
          <p>{error} Showing the last successfully loaded results.</p>
          <button type="button" onClick={() => void loadInterviews(true)} className="shrink-0 font-semibold underline decoration-rose-300 underline-offset-2 hover:text-rose-950">Try again</button>
        </div>
      )}

      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Interview summary">
        <SummaryCard label="Total interviews" value={isLoading ? undefined : interviews.length} note="All practice sessions" icon={BriefcaseBusiness} tone="indigo" />
        <SummaryCard label="Technical interviews" value={isLoading ? undefined : interviews.filter((item) => item.interviewType === 'TECHNICAL').length} note="Technical practice" icon={Code2} tone="sky" />
        <SummaryCard label="Behavioral interviews" value={isLoading ? undefined : interviews.filter((item) => item.interviewType === 'BEHAVIORAL').length} note="Behavioral practice" icon={UsersRound} tone="violet" />
        <SummaryCard label="Recently created" value={isLoading ? undefined : recentCount} note={`Created in the last ${RECENT_WINDOW_DAYS} days`} icon={Activity} tone="emerald" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.02)]" aria-labelledby="recent-interviews-heading">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 id="recent-interviews-heading" className="text-sm font-bold text-slate-900">Recent interviews</h2><p className="mt-1 text-xs text-slate-500">Your latest practice sessions</p></div>
          <span className="text-xs font-medium text-slate-400">{isLoading ? 'Loading…' : `${interviews.length} ${interviews.length === 1 ? 'session' : 'sessions'}`}</span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5 sm:p-6" aria-label="Loading interviews" aria-busy="true">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : error && interviews.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600"><Activity size={19} /></div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">We couldn’t load your interviews</h3>
            <p role="alert" className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">{error}</p>
            <button type="button" onClick={() => void loadInterviews(true)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-700"><RefreshCw size={14} /> Try again</button>
          </div>
        ) : interviews.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><BriefcaseBusiness size={19} /></div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">No interviews yet</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">Create your first practice session to start preparing for your next opportunity.</p>
            <Link to="/interviews/new" className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-700"><Plus size={15} /> Create interview</Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  <tr><th className="px-6 py-3.5">Role &amp; topic</th><th className="px-4 py-3.5">Type</th><th className="px-4 py-3.5">Difficulty</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5">Created</th><th className="px-6 py-3.5 text-right"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInterviews.map((interview) => (
                    <tr key={interview.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4"><p className="text-xs font-semibold text-slate-800">{interview.role}</p><p className="mt-1 text-[11px] text-slate-500">{interview.topic}</p></td>
                      <td className="px-4 py-4"><InterviewBadge kind="type" value={interview.interviewType} /></td>
                      <td className="px-4 py-4"><InterviewBadge kind="difficulty" value={interview.difficulty} /></td>
                      <td className="px-4 py-4"><InterviewBadge kind="status" value={interview.status} /></td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatCreatedDate(interview.createdAt)}</td>
                      <td className="px-6 py-4 text-right"><button type="button" onClick={() => setSelectedInterview(interview)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 hover:text-brand-700">View details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {recentInterviews.map((interview) => (
                <article key={interview.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-800">{interview.role}</h3><p className="mt-1 text-xs text-slate-500">{interview.topic}</p></div><button type="button" onClick={() => setSelectedInterview(interview)} className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50">View details</button></div>
                  <div className="mt-3 flex flex-wrap gap-2"><InterviewBadge kind="type" value={interview.interviewType} /><InterviewBadge kind="difficulty" value={interview.difficulty} /><InterviewBadge kind="status" value={interview.status} /></div>
                  <p className="mt-3 text-[11px] text-slate-400">Created {formatCreatedDate(interview.createdAt)}</p>
                </article>
              ))}
            </div>
            {interviews.length > RECENT_INTERVIEW_LIMIT && <div className="border-t border-slate-100 px-5 py-3.5 text-center sm:px-6"><Link to="/interviews" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all {interviews.length} interviews</Link></div>}
          </>
        )}
      </section>

      {selectedInterview && <InterviewDetailsDialog interview={selectedInterview} onClose={() => setSelectedInterview(null)} />}
    </>
  )
}
