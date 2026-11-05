import { BrainCircuit, LayoutDashboard, Settings2, Sparkles, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'My Interviews', to: '/interviews', icon: BrainCircuit, end: true },
  { label: 'Create Interview', to: '/interviews/new', icon: Sparkles },
  { label: 'Settings', to: '/settings', icon: Settings2 },
]

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 ease-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="Main navigation"
    >
      <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
        <NavLink to="/" onClick={onClose} className="flex items-center gap-3" aria-label="AI Interview Coach home">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shadow-indigo-200">
            <BrainCircuit size={21} strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-[14px] font-bold tracking-[-0.02em] text-slate-900">AI Interview</span>
            <span className="block text-[12px] font-medium text-slate-500">Coach</span>
          </span>
        </NavLink>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close navigation">
          <X size={19} />
        </button>
      </div>

      <div className="px-4 pt-7">
        <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Workspace</p>
        <nav className="space-y-1">
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-[11px] text-[13px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => <><Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} /><span>{label}</span>{label === 'Settings' && <span className="ml-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">Soon</span>}</>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
          <div className="mb-3 grid size-9 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-indigo-100">
            <Sparkles size={17} />
          </div>
          <p className="text-[13px] font-bold text-slate-900">Practice with purpose</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">A little preparation makes a big difference.</p>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 px-2 pt-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">JD</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-800">Jordan Davis</p>
            <p className="truncate text-[11px] text-slate-500">Personal workspace</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
