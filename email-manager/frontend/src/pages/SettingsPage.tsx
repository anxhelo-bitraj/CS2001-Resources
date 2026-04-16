import { Settings, Moon, Sun, Bell, Clock } from 'lucide-react';
import { useUiStore } from '../store/uiStore';
import { useAuth } from '../auth/useAuth';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useUiStore();
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
          <Settings size={22} className="text-slate-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
      </div>

      {/* Account */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Account</h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">
            {user?.displayName?.slice(0, 1) || '?'}
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">{user?.displayName}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
            Dark mode
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sync & Briefing info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Automation</h2>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <Clock size={15} className="text-blue-500" />
            <span>Email sync runs every <strong>5 minutes</strong> automatically</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sun size={15} className="text-amber-500" />
            <span>Morning briefing generated at <strong>7:30 AM</strong> weekdays</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Bell size={15} className="text-purple-500" />
            <span>Follow-up reminders checked every <strong>15 minutes</strong></span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-base">🧠</span>
            <span>Tone profiles re-analysed nightly for stale contacts</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3">
          To change schedules, update <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">MORNING_BRIEFING_CRON</code> and related variables in the backend <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.env</code> file.
        </p>
      </div>

      {/* Setup Guide */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Setup Checklist</h2>
        <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-300">
          <li className="flex gap-2">✅ Sign in with Microsoft</li>
          <li className="flex gap-2">☑ Set <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">VITE_AZURE_CLIENT_ID</code> in frontend <code>.env</code></li>
          <li className="flex gap-2">☑ Set <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ANTHROPIC_API_KEY</code> in backend <code>.env</code></li>
          <li className="flex gap-2">☑ Register Azure App with correct redirect URI and Graph permissions</li>
          <li className="flex gap-2">☑ Click Sync to import your Outlook inbox</li>
          <li className="flex gap-2">☑ Categorise contacts in the Contacts page</li>
          <li className="flex gap-2">☑ Generate your first Morning Briefing</li>
        </ul>
      </div>
    </div>
  );
}
