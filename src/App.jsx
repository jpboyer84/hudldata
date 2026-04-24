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
        Coming in Phase 2
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Main app — no auth required */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/trackers" element={<PlaceholderPage title="Tag a game" />} />
      <Route path="/tracker/:gameId" element={<PlaceholderPage title="Tracker" />} />
      <Route path="/archive" element={<PlaceholderPage title="Archive" />} />
      <Route path="/templates" element={<PlaceholderPage title="Templates" />} />
      <Route path="/columns" element={<PlaceholderPage title="Columns" />} />
      <Route path="/stats" element={<PlaceholderPage title="Stats & Analysis" />} />
      <Route path="/playbook" element={<PlaceholderPage title="Playbook" />} />
      <Route path="/help" element={<PlaceholderPage title="Help" />} />
      <Route path="/import" element={<PlaceholderPage title="Import" />} />

      {/* Auth pages — available but not required */}
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
