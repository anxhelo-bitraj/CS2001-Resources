import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { loginRequest } from '../auth/msalConfig';
import { Mail, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only redirect once MSAL has finished initialising and we know auth state
    if (inProgress === InteractionStatus.None && isAuthenticated) {
      navigate('/app/briefing', { replace: true });
    }
  }, [isAuthenticated, inProgress, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await instance.loginPopup(loginRequest);
      navigate('/app/briefing', { replace: true });
    } catch (err) {
      console.error('Login error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Mail size={32} className="text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">GM Email Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Intelligent email management for restaurant general managers
          </p>
        </div>

        <div className="space-y-2 text-left text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🧠</span>
            <span>Learns your writing tone per contact</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚡</span>
            <span>AI-powered drafts, summaries & task extraction</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📊</span>
            <span>Priority categorisation & daily briefing</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🍽️</span>
            <span>15 restaurant-specific email templates</span>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-md"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
          )}
          Sign in with Microsoft
        </button>

        <p className="text-xs text-slate-400">
          Your Outlook credentials are handled securely by Microsoft.<br />
          No passwords are stored by this app.
        </p>
      </div>
    </div>
  );
}
