import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '../auth/RouteGuards'
import DashboardLayout from '../components/layout/DashboardLayout'

const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const CreateInterviewPage = lazy(() => import('../pages/CreateInterviewPage'))
const InterviewsPage = lazy(() => import('../pages/InterviewsPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const InterviewDetailsPage = lazy(() => import('../pages/InterviewDetailsPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))

export default function App() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500" role="status">Loading page…</div>}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="interviews" element={<InterviewsPage />} />
            <Route path="interviews/new" element={<CreateInterviewPage />} />
            <Route path="interviews/:id" element={<InterviewDetailsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
