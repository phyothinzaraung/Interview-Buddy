import type { Difficulty, InterviewStatus, InterviewType } from '../../api/types'

type InterviewBadgeProps =
  | { kind: 'type'; value: InterviewType }
  | { kind: 'difficulty'; value: Difficulty }
  | { kind: 'status'; value: InterviewStatus }

const labels: Record<InterviewType | Difficulty | InterviewStatus, string> = {
  TECHNICAL: 'Technical', BEHAVIORAL: 'Behavioral', SYSTEM_DESIGN: 'System design',
  BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced',
  NOT_STARTED: 'Not started', IN_PROGRESS: 'In progress', COMPLETED: 'Completed',
}

const styles: Record<InterviewType | Difficulty | InterviewStatus, string> = {
  TECHNICAL: 'bg-sky-50 text-sky-700 ring-sky-100',
  BEHAVIORAL: 'bg-violet-50 text-violet-700 ring-violet-100',
  SYSTEM_DESIGN: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  BEGINNER: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  INTERMEDIATE: 'bg-amber-50 text-amber-700 ring-amber-100',
  ADVANCED: 'bg-rose-50 text-rose-700 ring-rose-100',
  NOT_STARTED: 'bg-slate-100 text-slate-600 ring-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
}

export default function InterviewBadge({ value }: InterviewBadgeProps) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${styles[value]}`}>{labels[value]}</span>
}
