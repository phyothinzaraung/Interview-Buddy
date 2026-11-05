import { ArrowUpRight, BriefcaseBusiness, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'

export default function InterviewsPage() {
  return (
    <>
      <PageHeader eyebrow="Your workspace" title="My Interviews" description="Your practice sessions, all in one place." action={<Link to="/interviews/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><Plus size={17} /> New interview</Link>} />
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><BriefcaseBusiness size={21} /></span>
        <h2 className="mt-4 text-sm font-bold text-slate-900">Your interviews will appear here</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">Create a practice interview to organize your preparation by role and focus area.</p>
        <Link to="/interviews/new" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700">Create your first interview <ArrowUpRight size={15} /></Link>
      </div>
    </>
  )
}
