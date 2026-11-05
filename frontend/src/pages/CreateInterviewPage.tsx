import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'

export default function CreateInterviewPage() {
  return (
    <>
      <Link to="/interviews" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back to interviews</Link>
      <PageHeader eyebrow="Get ready" title="Create an interview" description="Set up a focused practice session for the opportunity ahead." />
      <section className="max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.02)] sm:p-8">
        <div className="flex items-start gap-3 rounded-xl bg-indigo-50 p-4 text-indigo-800"><Sparkles size={18} className="mt-0.5 shrink-0" /><p className="text-xs leading-5">Your interview setup will help tailor practice questions to your role. Form and backend integration are coming next.</p></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Role title<input disabled placeholder="e.g. Product Designer" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-500 outline-none placeholder:text-slate-400" /></label>
          <label className="text-xs font-semibold text-slate-700">Interview type<select disabled className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-500"><option>Select a type</option></select></label>
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Focus area<input disabled placeholder="What would you like to practice?" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-500 outline-none placeholder:text-slate-400" /></label>
        </div>
        <button type="button" disabled className="mt-6 h-11 rounded-xl bg-slate-200 px-4 text-sm font-semibold text-slate-500">Create practice interview</button>
      </section>
    </>
  )
}
