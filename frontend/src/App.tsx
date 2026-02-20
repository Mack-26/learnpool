import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ClassListPage from './pages/ClassListPage'
import SessionListPage from './pages/SessionListPage'
import ChatPage from './pages/ChatPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/classes" element={<ProtectedRoute><ClassListPage /></ProtectedRoute>} />
      <Route path="/classes/:courseId" element={<ProtectedRoute><SessionListPage /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/classes" replace />} />
    </Routes>
  )
}
