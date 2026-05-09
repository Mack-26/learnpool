import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DefaultRedirect from './components/DefaultRedirect'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import ClassListPage from './pages/ClassListPage'
import SessionListPage from './pages/SessionListPage'
import SessionDetailPage from './pages/SessionDetailPage'
import ChatPage from './pages/ChatPage'
import ReportPage from './pages/ReportPage'
import ProfessorClassListPage from './pages/ProfessorClassListPage'
import ProfessorCourseViewPage from './pages/ProfessorCourseViewPage'
import ProfessorReportsPage from './pages/ProfessorReportsPage'
import ScheduleLecturePage from './pages/ScheduleLecturePage'
import LectureMaterialsPage from './pages/LectureMaterialsPage'
import NotesPage from './pages/NotesPage'
import ClassThreadsPage from './pages/ClassThreadsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<OnboardingPage />} />
      {/* Student routes */}
      <Route path="/classes" element={<ProtectedRoute requireRole="student"><ClassListPage /></ProtectedRoute>} />
      <Route path="/classes/materials" element={<ProtectedRoute requireRole="student"><LectureMaterialsPage /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute requireRole="student"><NotesPage /></ProtectedRoute>} />
      <Route path="/classes/:courseId" element={<ProtectedRoute requireRole="student"><SessionListPage /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId" element={<ProtectedRoute requireRole="student"><SessionDetailPage /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId/chat" element={<ProtectedRoute requireRole="student"><ChatPage /></ProtectedRoute>} />
<Route path="/sessions/:sessionId/threads" element={<ProtectedRoute requireRole="student"><ClassThreadsPage /></ProtectedRoute>} />
      {/* Shared: report works for both student and professor */}
      <Route path="/sessions/:sessionId/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
{/* Professor routes */}
      <Route path="/instructor" element={<ProtectedRoute requireRole="professor"><ProfessorClassListPage /></ProtectedRoute>} />
      <Route path="/instructor/courses/:courseId" element={<ProtectedRoute requireRole="professor"><ProfessorCourseViewPage /></ProtectedRoute>} />
      <Route path="/instructor/courses/:courseId/schedule/:sessionId" element={<ProtectedRoute requireRole="professor"><ScheduleLecturePage /></ProtectedRoute>} />
      <Route path="/instructor/courses/:courseId/schedule" element={<ProtectedRoute requireRole="professor"><ScheduleLecturePage /></ProtectedRoute>} />
      <Route path="/instructor/courses/:courseId/reports" element={<ProtectedRoute requireRole="professor"><ProfessorReportsPage /></ProtectedRoute>} />
      <Route path="/instructor/materials" element={<ProtectedRoute requireRole="professor"><LectureMaterialsPage /></ProtectedRoute>} />
<Route path="*" element={<DefaultRedirect />} />
    </Routes>
  )
}
