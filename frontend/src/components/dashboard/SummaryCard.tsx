import type { LucideIcon } from 'lucide-react'

type SummaryCardProps = {
  label: string
  value?: number
  note: string
  icon: LucideIcon
  tone: 'indigo' | 'sky' | 'violet' | 'emerald'
}

const toneClasses = {
  indigo: 'bg-indigo-50 text-indigo-600',
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}

export default function SummaryCard({ label, value, note, icon: Icon, tone }: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-500">{label}</p>{value === undefined ? <div className="mt-3 h-8 w-14 animate-pulse rounded-md bg-slate-100" /> : <p className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-slate-900">{value}</p>}</div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}><Icon size={19} /></span>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{note}</p>
    </article>
  )
}
