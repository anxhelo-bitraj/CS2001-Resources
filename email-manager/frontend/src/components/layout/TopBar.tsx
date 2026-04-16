import { RefreshCw, Moon, Sun } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/useAuth';
import { useUiStore } from '../../store/uiStore';
import { emailApi } from '../../api/emailApi';
import NotificationBell from './NotificationBell';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useUiStore();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: emailApi.sync,
    onSuccess: (data) => {
      toast.success(`Synced ${data.data.synced} emails`);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['emailCounts'] });
    },
    onError: () => toast.error('Sync failed — check your connection'),
  });

  const initials = user?.displayName
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
      <div className="flex-1" />

      <button
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Sync emails"
      >
        <RefreshCw size={15} className={syncMutation.isPending ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">Sync</span>
      </button>

      <button
        onClick={toggleDarkMode}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Toggle dark mode"
      >
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <NotificationBell />

      <button
        onClick={logout}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={`Signed in as ${user?.email}`}
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </div>
        <span className="hidden md:inline text-sm text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
          {user?.displayName || user?.email}
        </span>
      </button>
    </header>
  );
}
