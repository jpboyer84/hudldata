import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';

// Pages
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TeamSetupPage from './pages/TeamSetupPage';

// Phase 2 pages
import TrackersHubPage from './pages/TrackersHubPage';
import TrackerPage from './pages/TrackerPage';
import ArchivePage from './pages/ArchivePage';
import TemplatesPage from './pages/TemplatesPage';
import TemplateBuilderPage from './pages/TemplateBuilderPage';
import ColumnsPage from './pages/ColumnsPage';
import ColumnBuilderPage from './pages/ColumnBuilderPage';
import StatsPage from './pages/StatsPage';
import { useAuth } from './hooks/useAuth';

// Placeholder for future phases
function PlaceholderPage({ title }) {
  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => window.history.back()}>← Back</button>
        <div className="hdr-title">{title}</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-muted)', fontSize: 14
      }}>
        Coming in Phase 3
      </div>
    </div>
  );
}

function AppRoutes() {
  const { passwordRecovery, user, coach, loading } = useAuth();

  // If password recovery mode, show reset form regardless of route
  if (passwordRecovery) {
    return <ResetPasswordPage />;
  }

  // If logged in but no coach/team profile, send to team setup
  // (skip while loading, and allow auth pages to remain accessible)
  if (!loading && user && !coach) {
    return (
      <Routes>
        <Route path="/team-setup" element={<TeamSetupPage />} />
        <Route path="/login" element={<Navigate to="/team-setup" replace />} />
        <Route path="/signup" element={<Navigate to="/team-setup" replace />} />
        <Route path="*" element={<Navigate to="/team-setup" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Main app */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/settings" element={<SettingsPage />} />

      {/* Phase 2: Game tracker */}
      <Route path="/trackers" element={<TrackersHubPage />} />
      <Route path="/tracker/:gameId" element={<TrackerPage />} />
      <Route path="/archive" element={<ArchivePage />} />

      {/* Phase 2: Templates & Columns */}
      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="/templates/new" element={<TemplateBuilderPage />} />
      <Route path="/templates/edit/:id" element={<TemplateBuilderPage />} />
      <Route path="/columns" element={<ColumnsPage />} />
      <Route path="/columns/new" element={<ColumnBuilderPage />} />
      <Route path="/columns/edit/:id" element={<ColumnBuilderPage />} />

      {/* Phase 3: Stats & Help */}
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/help" element={<Navigate to="/settings" replace />} />

      {/* Future */}
      <Route path="/playbook" element={<PlaceholderPage title="Playbook" />} />
      <Route path="/import" element={<PlaceholderPage title="Import" />} />

      {/* Auth pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/team-setup" element={<TeamSetupPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
