import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ClassListPage from './pages/ClassListPage'
import SessionListPage from './pages/SessionListPage'
import SessionDetailPage from './pages/SessionDetailPage'
import ChatPage from './pages/ChatPage'
import ReportPage from './pages/ReportPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/classes" element={<ProtectedRoute><ClassListPage /></ProtectedRoute>} />
      <Route path="/classes/:courseId" element={<ProtectedRoute><SessionListPage /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId" element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/classes" replace />} />
    </Routes>
  )
}
