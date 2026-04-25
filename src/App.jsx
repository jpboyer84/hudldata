import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';

// Pages
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TeamSetupPage from './pages/TeamSetupPage';

// Phase 2 pages
import TrackersHubPage from './pages/TrackersHubPage';
import TrackerPage from './pages/TrackerPage';
import ArchivePage from './pages/ArchivePage';
import TemplatesPage from './pages/TemplatesPage';
import TemplateBuilderPage from './pages/TemplateBuilderPage';
import ColumnsPage from './pages/ColumnsPage';
import ColumnBuilderPage from './pages/ColumnBuilderPage';

// Placeholder pages for future phases
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

      {/* Phase 3 placeholders */}
      <Route path="/stats" element={<PlaceholderPage title="Stats & Analysis" />} />
      <Route path="/playbook" element={<PlaceholderPage title="Playbook" />} />
      <Route path="/help" element={<PlaceholderPage title="Help" />} />
      <Route path="/import" element={<PlaceholderPage title="Import" />} />

      {/* Auth pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
