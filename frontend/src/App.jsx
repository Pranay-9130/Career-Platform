import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth Context & Guards
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleGuard } from './components/auth';
import PageLoadingFallback from './components/common/PageLoadingFallback';
import ScrollToTop from './components/common/ScrollToTop';
import { ErrorBoundary } from './components/common';

// Layouts
import PublicLayout from './layouts/PublicLayout';
const StudentLayout = lazy(() => import('./layouts/StudentLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));

// Eagerly loaded entry page for instant initial rendering
import HomePage from './pages/public/HomePage';

// Lazy Loaded Secondary Public Pages
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ProjectsPage = lazy(() => import('./pages/public/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/public/ProjectDetailPage'));
const JobsPage = lazy(() => import('./pages/public/JobsPage'));
const JobDetailPage = lazy(() => import('./pages/public/JobDetailPage'));
const TemplatesPage = lazy(() => import('./pages/public/TemplatesPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const DesignSystemShowcasePage = lazy(() => import('./pages/public/DesignSystemShowcasePage'));
const SubmissionGuidelinesPage = lazy(() => import('./pages/public/SubmissionGuidelinesPage'));
const PublicProfilePage = lazy(() => import('./pages/public/PublicProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Lazy Loaded Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Lazy Loaded Student Workspace Pages
const DashboardPage = lazy(() => import('./pages/student/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/student/ProfilePage'));
const ProjectSubmissionPage = lazy(() => import('./pages/student/ProjectSubmissionPage'));
const MyProjectsPage = lazy(() => import('./pages/student/MyProjectsPage'));
const ApplicationsPage = lazy(() => import('./pages/student/ApplicationsPage'));
const SavedWorkspacePage = lazy(() => import('./pages/student/SavedWorkspacePage'));
const ResumeBuilderPage = lazy(() => import('./pages/student/ResumeBuilderPage'));
const AtsAnalyzerPage = lazy(() => import('./pages/student/AtsAnalyzerPage'));
const SkillIntelligencePage = lazy(() => import('./pages/student/SkillIntelligencePage'));

// Lazy Loaded Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
          <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Public Marketing, Discovery & Portfolio Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route
                path="/projects/submit"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'CONTRIBUTOR', 'ADMIN']}>
                    <ProjectSubmissionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:slug/edit"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'CONTRIBUTOR', 'ADMIN']}>
                    <ProjectSubmissionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/edit/:slug"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'CONTRIBUTOR', 'ADMIN']}>
                    <ProjectSubmissionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:slug"
                element={<ProjectDetailPage />}
              />
              <Route path="/submission-guidelines" element={<SubmissionGuidelinesPage />} />
              <Route path="/guidelines" element={<SubmissionGuidelinesPage />} />
              <Route path="/projects/submit/guidelines" element={<SubmissionGuidelinesPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route
                path="/jobs/:id"
                element={
                  <ProtectedRoute>
                    <JobDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/design-system" element={<DesignSystemShowcasePage />} />

              {/* Public Student Portfolio Routes */}
              <Route path="/u/:username" element={<PublicProfilePage />} />
              <Route path="/profile/:username" element={<PublicProfilePage />} />

              {/* Auth Flow */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Student Workspace Routes: Protected by Session */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'CONTRIBUTOR', 'ADMIN']} />}>
              <Route element={<StudentLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/my-projects" element={<MyProjectsPage />} />
                <Route path="/resume-builder" element={<ResumeBuilderPage />} />
                <Route path="/ats-analyzer" element={<AtsAnalyzerPage />} />
                <Route path="/skill-intelligence" element={<SkillIntelligencePage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/saved" element={<SavedWorkspacePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<Navigate to="/profile" replace />} />
              </Route>
            </Route>

            {/* Admin Console Routes: Protected by Admin RoleGuard */}
            <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="projects" element={<AdminDashboardPage />} />
                <Route path="jobs" element={<AdminDashboardPage />} />
                <Route path="students" element={<AdminDashboardPage />} />
                <Route path="templates" element={<AdminDashboardPage />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
    </AuthProvider>
  );
}
