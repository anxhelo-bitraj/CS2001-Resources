import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUiStore } from './store/uiStore';
import LoginPage from './pages/LoginPage';
import AppShell from './components/layout/AppShell';
import InboxPage from './pages/InboxPage';
import CategoryPage from './pages/CategoryPage';
import BriefingPage from './pages/BriefingPage';
import TasksPage from './pages/TasksPage';
import TemplatesPage from './pages/TemplatesPage';
import ContactsPage from './pages/ContactsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  // While MSAL is initialising (startup, handling redirect/popup) do not
  // redirect — the auth state is not yet settled and a premature redirect to
  // /login would create a loop.
  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const darkMode = useUiStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<Navigate to="/app/inbox" replace />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="briefing" replace />} />
          <Route path="briefing" element={<BriefingPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="category/:category" element={<CategoryPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
