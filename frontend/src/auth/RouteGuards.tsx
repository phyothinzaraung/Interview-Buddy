import { BrainCircuit, RefreshCw } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function SessionLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-indigo-200">
          <BrainCircuit size={24} />
        </span>
        <p className="mt-5 text-sm font-semibold text-slate-800">Checking your session…</p>
        <span className="mt-4 h-1 w-28 overflow-hidden rounded-full bg-indigo-100">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-brand-600" />
        </span>
      </div>
    </main>
  )
}

export function ProtectedRoute() {
  const { status, error, retrySessionRestore } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <SessionLoading />
  if (status === 'error') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <section className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
          <h1 className="text-lg font-bold text-slate-900">We couldn’t verify your session</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
          <button type="button" onClick={() => void retrySessionRestore()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            <RefreshCw size={16} /> Try again
          </button>
          <Link to="/login" className="mt-4 block text-sm font-semibold text-brand-700 hover:text-brand-800">Go to sign in</Link>
        </section>
      </main>
    )
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

export function GuestRoute() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <SessionLoading />
  if (status === 'authenticated') {
    const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
    return <Navigate to={destination} replace />
  }
  return <Outlet />
}
