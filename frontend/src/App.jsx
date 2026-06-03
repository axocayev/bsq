import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import azAZ from 'antd/locale/az_AZ';
import ruRU from 'antd/locale/ru_RU';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';

const antdLocale = { en: enUS, az: azAZ, ru: ruRU };
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SchoolsPage from './pages/admin/SchoolsPage';
import UsersPage from './pages/admin/UsersPage';
import AdminExamsPage from './pages/admin/AdminExamsPage';
import AdminSubjectsPage from './pages/admin/SubjectsPage';
import SchoolAdminDashboard from './pages/school-admin/SchoolAdminDashboard';
import SchoolUsersPage from './pages/school-admin/SchoolUsersPage';
import SchoolExamsPage from './pages/school-admin/SchoolExamsPage';
import SchoolAdminSubjectsPage from './pages/school-admin/SubjectsPage';
import ExamAssignmentsPage from './pages/school-admin/ExamAssignmentsPage';
import AssignmentResultPage from './pages/school-admin/AssignmentResultPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import SubjectsPage from './pages/teacher/SubjectsPage';
import QuestionsPage from './pages/teacher/QuestionsPage';
import CreateQuestionPage from './pages/teacher/CreateQuestionPage';
import ExamsPage from './pages/teacher/ExamsPage';
import ExamManagePage from './pages/teacher/ExamManagePage';
import ExamResultsPage from './pages/teacher/ExamResultsPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentExamsPage from './pages/student/StudentExamsPage';
import TakeExamPage from './pages/student/TakeExamPage';
import ExamResultPage from './pages/student/ExamResultPage';

const roleHome = {
  ADMIN: '/admin/dashboard',
  SCHOOL_ADMIN: '/school-admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
};

function Home() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return <Navigate to={roleHome[user.role] || '/'} replace />;
}

export default function App() {
  const { i18n } = useTranslation();
  const locale = antdLocale[i18n.language] || enUS;

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }} locale={locale}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<div style={{ padding: 40, textAlign: 'center' }}>403 — Access Denied</div>} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* Admin */}
              <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/schools" element={<ProtectedRoute roles={['ADMIN']}><SchoolsPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
              <Route path="/admin/exams" element={<ProtectedRoute roles={['ADMIN']}><AdminExamsPage /></ProtectedRoute>} />
              <Route path="/admin/subjects" element={<ProtectedRoute roles={['ADMIN']}><AdminSubjectsPage /></ProtectedRoute>} />

              {/* School Admin */}
              <Route path="/school-admin/dashboard" element={<ProtectedRoute roles={['SCHOOL_ADMIN']}><SchoolAdminDashboard /></ProtectedRoute>} />
              <Route path="/school-admin/users" element={<ProtectedRoute roles={['SCHOOL_ADMIN']}><SchoolUsersPage /></ProtectedRoute>} />
              <Route path="/school-admin/exams" element={<ProtectedRoute roles={['SCHOOL_ADMIN']}><SchoolExamsPage /></ProtectedRoute>} />
              <Route path="/school-admin/subjects" element={<ProtectedRoute roles={['SCHOOL_ADMIN']}><SchoolAdminSubjectsPage /></ProtectedRoute>} />
              <Route path="/school-admin/exams/:examId/assignments" element={<ProtectedRoute roles={['SCHOOL_ADMIN']}><ExamAssignmentsPage /></ProtectedRoute>} />
              <Route path="/school-admin/assignments/:assignmentId/result" element={<ProtectedRoute roles={['SCHOOL_ADMIN']}><AssignmentResultPage /></ProtectedRoute>} />

              {/* Teacher */}
              <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/subjects" element={<ProtectedRoute roles={['TEACHER']}><SubjectsPage /></ProtectedRoute>} />
              <Route path="/teacher/questions" element={<ProtectedRoute roles={['TEACHER']}><QuestionsPage /></ProtectedRoute>} />
              <Route path="/teacher/questions/create" element={<ProtectedRoute roles={['TEACHER']}><CreateQuestionPage /></ProtectedRoute>} />
              <Route path="/teacher/questions/:id/edit" element={<ProtectedRoute roles={['TEACHER']}><CreateQuestionPage /></ProtectedRoute>} />
              <Route path="/teacher/exams" element={<ProtectedRoute roles={['TEACHER']}><ExamsPage /></ProtectedRoute>} />
              <Route path="/teacher/exams/:examId/manage" element={<ProtectedRoute roles={['TEACHER']}><ExamManagePage /></ProtectedRoute>} />
              <Route path="/teacher/exams/:examId/results" element={<ProtectedRoute roles={['TEACHER']}><ExamResultsPage /></ProtectedRoute>} />

              {/* Student */}
              <Route path="/student/dashboard" element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/exams" element={<ProtectedRoute roles={['STUDENT']}><StudentExamsPage /></ProtectedRoute>} />
              <Route path="/student/exams/:examId/take" element={<ProtectedRoute roles={['STUDENT']}><TakeExamPage /></ProtectedRoute>} />
              <Route path="/student/exams/:examId/result" element={<ProtectedRoute roles={['STUDENT']}><ExamResultPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
