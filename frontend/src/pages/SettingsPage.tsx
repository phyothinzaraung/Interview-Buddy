import { Settings2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

export default function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Workspace" title="Settings" description="Manage your account and preferences." />
      <div className="max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500"><Settings2 size={20} /></span>
        <h2 className="mt-4 text-sm font-bold text-slate-900">Settings are on the way</h2>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">This page is a placeholder for account and practice preferences.</p>
      </div>
    </>
  )
}
