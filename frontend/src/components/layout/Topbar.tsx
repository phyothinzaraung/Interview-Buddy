import { Bell, ChevronDown, Menu, Search } from 'lucide-react'

type TopbarProps = { onMenuClick: () => void }

export default function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
          <Menu size={21} />
        </button>
        <div className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 md:flex">
          <Search size={16} />
          <span className="text-xs">Search anything...</span>
          <span className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘ K</span>
        </div>
        <p className="truncate text-sm font-semibold text-slate-700 md:hidden">AI Interview Coach</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button type="button" className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800" aria-label="Notifications">
          <Bell size={19} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-500 ring-2 ring-white" />
        </button>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <button type="button" className="flex items-center gap-2 rounded-xl p-1.5 pr-1 text-left hover:bg-slate-50" aria-label="Account menu">
          <span className="grid size-8 place-items-center rounded-full bg-indigo-100 text-[11px] font-bold text-brand-700">JD</span>
          <span className="hidden text-xs font-semibold text-slate-700 sm:block">Jordan Davis</span>
          <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  )
}
