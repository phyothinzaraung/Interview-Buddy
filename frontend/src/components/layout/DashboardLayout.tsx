import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div className="min-h-screen lg:pl-[264px]">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
