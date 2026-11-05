import { ArrowRight, ArrowUpRight, Brain, BriefcaseBusiness, Clock3, Plus, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'

const stats = [
  { label: 'Interviews practiced', value: '12', note: 'Across 4 roles', icon: BriefcaseBusiness, tone: 'bg-indigo-50 text-indigo-600' },
  { label: 'Questions explored', value: '86', note: 'Keep building momentum', icon: Brain, tone: 'bg-sky-50 text-sky-600' },
  { label: 'Practice time', value: '4.5h', note: 'This month', icon: Clock3, tone: 'bg-violet-50 text-violet-600' },
]

const recentInterviews = [
  { role: 'Senior Product Designer', company: 'Northstar Labs', date: 'Today', type: 'Product design', color: 'bg-violet-100 text-violet-700' },
  { role: 'Frontend Engineer', company: 'Vertex', date: 'Yesterday', type: 'Technical', color: 'bg-sky-100 text-sky-700' },
  { role: 'Product Manager', company: 'Mosaic', date: 'Oct 28', type: 'Behavioral', color: 'bg-amber-100 text-amber-700' },
]

export default function DashboardPage() {
  return (
    <>
      <PageHeader eyebrow="Tuesday, November 4" title="Good morning, Jordan" description="Ready to feel more confident in your next interview?" action={<Link to="/interviews/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-brand-700"><Plus size={17} /> New interview</Link>} />

      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Practice overview">
        {stats.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-3 text-[28px] font-bold tracking-[-0.04em] text-slate-900">{value}</p></div>
              <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{note}</p>
          </article>
        ))}
      </section>

      <section className="mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-soft sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-indigo-50"><Sparkles size={13} /> YOUR NEXT STEP</span>
            <h2 className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">Make your next answer your best one.</h2>
            <p className="mt-2 text-sm leading-6 text-indigo-100">Start a focused practice session tailored to the role you’re pursuing.</p>
          </div>
          <Link to="/interviews/new" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 sm:self-auto">Start practicing <ArrowRight size={16} /></Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-sm font-bold text-slate-900">Recent interviews</h2><p className="mt-1 text-xs text-slate-500">Pick up where you left off</p></div>
            <Link to="/interviews" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentInterviews.map((interview) => (
              <article key={interview.role} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold ${interview.color}`}>{interview.company.slice(0, 1)}</span>
                <div className="min-w-0 flex-1"><h3 className="truncate text-xs font-semibold text-slate-800">{interview.role}</h3><p className="mt-1 text-[11px] text-slate-500">{interview.company} <span className="px-1 text-slate-300">·</span> {interview.type}</p></div>
                <div className="hidden text-right sm:block"><p className="text-[11px] font-medium text-slate-600">{interview.date}</p><p className="mt-1 text-[10px] text-slate-400">Practice session</p></div>
                <button type="button" aria-label={`Open ${interview.role}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"><ArrowUpRight size={16} /></button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Target size={18} /></span><div><h2 className="text-sm font-bold text-slate-900">Your focus</h2><p className="mt-0.5 text-[11px] text-slate-500">Small steps add up</p></div></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-800">Practice consistently</p><p className="mt-1.5 text-[11px] leading-5 text-slate-500">Try three focused sessions this week to build a steady routine.</p><div className="mt-4 flex items-center justify-between text-[10px] font-medium"><span className="text-slate-500">Weekly sessions</span><span className="text-slate-700">1 of 3</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-1/3 rounded-full bg-brand-500" /></div></div>
          <Link to="/interviews/new" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">Create a practice session <ArrowRight size={14} /></Link>
        </section>
      </div>
    </>
  )
}
