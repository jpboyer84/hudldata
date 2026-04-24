import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TeamSetupPage from './pages/TeamSetupPage';
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', color: 'var(--color-muted)', fontSize: 13
    }}>
      Loading…
    </div>
  );
}

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

function ProtectedRoute({ children }) {
  const { user, coach, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  // User is authenticated but has no team/coach profile yet
  if (!coach) return <Navigate to="/team-setup" replace />;

  return children;
}

function AuthRoute({ children }) {
  const { user, coach, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user && coach) return <Navigate to="/" replace />;
  if (user && !coach) return <Navigate to="/team-setup" replace />;

  return children;
}

function TeamSetupRoute() {
  const { user, coach, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (coach) return <Navigate to="/" replace />;

  return <TeamSetupPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPasswordPage /></AuthRoute>} />
      <Route path="/team-setup" element={<TeamSetupRoute />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Phase 2+ placeholders */}
      <Route path="/trackers" element={<ProtectedRoute><PlaceholderPage title="Tag a game" /></ProtectedRoute>} />
      <Route path="/tracker/:gameId" element={<ProtectedRoute><PlaceholderPage title="Tracker" /></ProtectedRoute>} />
      <Route path="/archive" element={<ProtectedRoute><PlaceholderPage title="Archive" /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><PlaceholderPage title="Templates" /></ProtectedRoute>} />
      <Route path="/columns" element={<ProtectedRoute><PlaceholderPage title="Columns" /></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><PlaceholderPage title="Stats & Analysis" /></ProtectedRoute>} />
      <Route path="/playbook" element={<ProtectedRoute><PlaceholderPage title="Playbook" /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><PlaceholderPage title="Help" /></ProtectedRoute>} />
      <Route path="/import" element={<ProtectedRoute><PlaceholderPage title="Import" /></ProtectedRoute>} />

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
