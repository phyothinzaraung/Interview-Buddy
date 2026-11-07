import { BrainCircuit, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthLayoutProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthLayout({ eyebrow, title, description, children, footer }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(500px,0.95fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_20%,rgba(99,102,241,0.35),transparent_45%),radial-gradient(ellipse_at_85%_90%,rgba(14,165,233,0.18),transparent_42%)]" />
        <div className="absolute -right-28 top-1/4 size-[420px] rounded-full border border-white/10" />
        <div className="absolute -right-12 top-[31%] size-[290px] rounded-full border border-white/10" />
        <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-3" aria-label="AI Interview Coach">
          <span className="grid size-11 place-items-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-indigo-950/50"><BrainCircuit size={23} /></span>
          <span className="leading-tight"><span className="block text-sm font-bold tracking-tight">AI Interview Coach</span><span className="mt-0.5 block text-xs text-slate-400">Interview Buddy</span></span>
        </Link>

        <div className="relative z-10 my-auto max-w-xl py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold text-indigo-200">
            <Sparkles size={14} /> Prepare with confidence
          </span>
          <h1 className="mt-7 text-4xl font-bold leading-[1.12] tracking-[-0.04em] xl:text-5xl">Make your next interview feel like a familiar conversation.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">Build focused practice sessions and get thoughtful, AI-generated questions tailored to the role you want.</p>
          <div className="mt-10 space-y-4">
            {['Practice for the roles that matter to you', 'Get questions tailored to your interview topic', 'Keep every preparation session in one place'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 size={17} className="shrink-0 text-indigo-300" /> {item}
              </div>
            ))}
          </div>
          <div className="mt-12 inline-flex items-center gap-2 text-xs font-medium text-slate-400"><ShieldCheck size={15} /> Your account and practice sessions stay private.</div>
        </div>
        <p className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} Interview Buddy</p>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-10 xl:px-16">
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-8">
          <Link to="/" className="mb-12 inline-flex items-center gap-2 self-start text-sm font-bold tracking-tight text-slate-900 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white"><BrainCircuit size={20} /></span>
            AI Interview Coach
          </Link>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          {children}
          <div className="mt-7 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">{footer}</div>
        </div>
        <p className="mx-auto mt-4 flex max-w-[440px] items-center justify-center gap-1.5 pb-1 text-center text-[11px] text-slate-400 lg:hidden"><ShieldCheck size={13} /> Your account and practice sessions stay private.</p>
      </section>
    </main>
  )
}
