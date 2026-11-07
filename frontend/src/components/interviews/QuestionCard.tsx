import { useState } from 'react'
import { ChevronDown, ChevronUp, ListChecks, Sparkles } from 'lucide-react'
import type { GeneratedQuestion } from '../../api/types'
import InterviewBadge from '../ui/InterviewBadge'

type QuestionCardProps = {
  question: GeneratedQuestion
  number: number
}

export default function QuestionCard({ question, number }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{String(number).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-6 text-slate-800">{question.questionText}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2"><InterviewBadge kind="difficulty" value={question.difficulty} /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{question.topic}</span></div>
        </div>
        <button type="button" onClick={() => setExpanded((open) => !open)} aria-expanded={expanded} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`${expanded ? 'Collapse' : 'Expand'} question ${number} details`}>
          {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>
      </div>

      {expanded && (
        <div className="grid gap-4 border-t border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 sm:p-5">
          <div>
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500"><ListChecks size={14} className="text-brand-500" /> Evaluation criteria</h3>
            {question.evaluationCriteria.length ? <ul className="mt-2 space-y-1.5">{question.evaluationCriteria.map((criterion, index) => <li key={`${index}-${criterion}`} className="flex gap-2 text-xs leading-5 text-slate-600"><span className="mt-2 size-1 shrink-0 rounded-full bg-slate-400" />{criterion}</li>)}</ul> : <p className="mt-2 text-xs text-slate-400">No evaluation criteria provided.</p>}
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500"><Sparkles size={14} className="text-brand-500" /> Expected key concepts</h3>
            {question.expectedKeyConcepts.length ? <ul className="mt-2 space-y-1.5">{question.expectedKeyConcepts.map((concept, index) => <li key={`${index}-${concept}`} className="flex gap-2 text-xs leading-5 text-slate-600"><span className="mt-2 size-1 shrink-0 rounded-full bg-slate-400" />{concept}</li>)}</ul> : <p className="mt-2 text-xs text-slate-400">No key concepts provided.</p>}
          </div>
        </div>
      )}
    </article>
  )
}
