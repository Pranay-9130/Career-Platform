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

// Resilient dynamic chunk loader to prevent deployment stale-chunk errors
function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem('page-has-been-force-refreshed') === 'true';
    try {
      const component = await componentImport();
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      }
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed && typeof window !== 'undefined') {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return { default: () => null };
      }
      throw error;
    }
  });
}

const StudentLayout = lazyWithRetry(() => import('./layouts/StudentLayout'));
const AdminLayout = lazyWithRetry(() => import('./layouts/AdminLayout'));

// Eagerly loaded entry page for instant initial rendering
import HomePage from './pages/public/HomePage';

// Lazy Loaded Secondary Public Pages
const AboutPage = lazyWithRetry(() => import('./pages/public/AboutPage'));
const ProjectsPage = lazyWithRetry(() => import('./pages/public/ProjectsPage'));
const ProjectDetailPage = lazyWithRetry(() => import('./pages/public/ProjectDetailPage'));
const JobsPage = lazyWithRetry(() => import('./pages/public/JobsPage'));
const JobDetailPage = lazyWithRetry(() => import('./pages/public/JobDetailPage'));
const TemplatesPage = lazyWithRetry(() => import('./pages/public/TemplatesPage'));
const ContactPage = lazyWithRetry(() => import('./pages/public/ContactPage'));
const DownloadAppPage = lazyWithRetry(() => import('./pages/public/DownloadAppPage'));
const DesignSystemShowcasePage = lazyWithRetry(() => import('./pages/public/DesignSystemShowcasePage'));
const SubmissionGuidelinesPage = lazyWithRetry(() => import('./pages/public/SubmissionGuidelinesPage'));
const TermsPage = lazyWithRetry(() => import('./pages/public/TermsPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/public/PrivacyPage'));
const PublicProfilePage = lazyWithRetry(() => import('./pages/public/PublicProfilePage'));
const PublicAtsAnalyzerPage = lazyWithRetry(() => import('./pages/public/features/PublicAtsAnalyzerPage'));
const PublicSkillIntelligencePage = lazyWithRetry(() => import('./pages/public/features/PublicSkillIntelligencePage'));
const PublicResumeBuilderPage = lazyWithRetry(() => import('./pages/public/features/PublicResumeBuilderPage'));
const PublicPlacementPrepPage = lazyWithRetry(() => import('./pages/public/features/PublicPlacementPrepPage'));
const PublicCollegeSurvivalKitPage = lazyWithRetry(() => import('./pages/public/features/PublicCollegeSurvivalKitPage'));
const CollegeSurvivalKitPage = lazyWithRetry(() => import('./pages/public/CollegeSurvivalKitPage'));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'));

// Lazy Loaded Auth Pages
const LoginPage = lazyWithRetry(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazyWithRetry(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/auth/ResetPasswordPage'));

// Lazy Loaded Student Workspace Pages
const DashboardPage = lazyWithRetry(() => import('./pages/student/DashboardPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/student/ProfilePage'));
const ProjectSubmissionPage = lazyWithRetry(() => import('./pages/student/ProjectSubmissionPage'));
const MyProjectsPage = lazyWithRetry(() => import('./pages/student/MyProjectsPage'));
const ApplicationsPage = lazyWithRetry(() => import('./pages/student/ApplicationsPage'));
const SavedWorkspacePage = lazyWithRetry(() => import('./pages/student/SavedWorkspacePage'));
const ResumeBuilderPage = lazyWithRetry(() => import('./pages/student/ResumeBuilderPage'));
const AtsAnalyzerPage = lazyWithRetry(() => import('./pages/student/AtsAnalyzerPage'));
const SkillIntelligencePage = lazyWithRetry(() => import('./pages/student/SkillIntelligencePage'));
const CareerDiscoveryPage = lazyWithRetry(() => import('./pages/student/CareerDiscoveryPage'));
const PlacementPrepLandingPage = lazyWithRetry(() => import('./pages/student/PlacementPrepLandingPage'));
const PlacementPrepRolePage = lazyWithRetry(() => import('./pages/student/PlacementPrepRolePage'));

// Lazy Loaded Admin Pages
const AdminDashboardPage = lazyWithRetry(() => import('./pages/admin/AdminDashboardPage'));
const AdminPlacementPrepPage = lazyWithRetry(() => import('./pages/admin/AdminPlacementPrepPage'));

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
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
                <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
                <Route path="/download-app" element={<DownloadAppPage />} />
                <Route path="/download" element={<Navigate to="/download-app" replace />} />
                <Route path="/design-system" element={<DesignSystemShowcasePage />} />

                {/* Public Feature Preview Pages */}
                <Route path="/features/career-discovery" element={<Navigate to="/career-discovery" replace />} />
                <Route path="/features/ats-analyzer" element={<PublicAtsAnalyzerPage />} />
                <Route path="/features/skill-intelligence" element={<PublicSkillIntelligencePage />} />
                <Route path="/features/resume-builder" element={<Navigate to="/templates" replace />} />
                <Route path="/placement-preparation" element={<PublicPlacementPrepPage />} />
                <Route path="/features/placement-preparation" element={<PublicPlacementPrepPage />} />
                <Route path="/features/college-survival-kit" element={<PublicCollegeSurvivalKitPage />} />

                {/* College Survival Kit Public Hub & Direct Tools */}
                <Route path="/college-survival-kit" element={<CollegeSurvivalKitPage />} />
                <Route path="/college-survival-kit/:toolId" element={<CollegeSurvivalKitPage />} />

                {/* Public Student Portfolio Routes */}
                <Route path="/u/:username" element={<PublicProfilePage />} />
                <Route path="/profile/:username" element={<PublicProfilePage />} />
                <Route path="/portfolio/:username" element={<PublicProfilePage />} />

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
                  <Route path="/career-discovery" element={<CareerDiscoveryPage />} />
                  <Route path="/my-projects" element={<MyProjectsPage />} />
                  <Route path="/resume-builder" element={<Navigate to="/templates" replace />} />
                  <Route path="/ats-analyzer" element={<AtsAnalyzerPage />} />
                  <Route path="/skill-intelligence" element={<SkillIntelligencePage />} />
                  <Route path="/placement-preparation" element={<PlacementPrepLandingPage />} />
                  <Route path="/placement-preparation/:roleSlug" element={<PlacementPrepRolePage />} />
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
                  <Route path="placement-preparation" element={<AdminPlacementPrepPage />} />
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
