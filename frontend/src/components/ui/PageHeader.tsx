import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export default function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.13em] text-brand-600">{eyebrow}</p>}
        <h1 className="text-[26px] font-bold tracking-[-0.035em] text-slate-900 sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
