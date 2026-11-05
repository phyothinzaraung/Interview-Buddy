import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import DashboardPage from '../pages/DashboardPage'
import CreateInterviewPage from '../pages/CreateInterviewPage'
import InterviewsPage from '../pages/InterviewsPage'
import SettingsPage from '../pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="interviews/new" element={<CreateInterviewPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
