import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Sun, Loader2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

export default function BriefingPage() {
  const queryClient = useQueryClient();

  const { data: briefing, isLoading } = useQuery({
    queryKey: ['briefing'],
    queryFn: () => axiosClient.get<{ content: string; email_count: number; task_count: number; briefing_date: string }>('/briefing'),
    select: (r) => r.data,
    staleTime: 5 * 60 * 1000,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => axiosClient.post('/briefing/regenerate'),
    onSuccess: () => {
      toast.success('Briefing regenerated');
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
    },
    onError: () => toast.error('Failed to generate briefing'),
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <Sun size={22} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Morning Briefing</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {briefing?.briefing_date || new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {briefing && (
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span>📧 {briefing.email_count} unread</span>
              <span>✅ {briefing.task_count} tasks</span>
            </div>
          )}
          <button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw size={14} className={regenerateMutation.isPending ? 'animate-spin' : ''} />
            Regenerate
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : briefing?.content ? (
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: briefing.content }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
          <Sun size={40} className="text-amber-300" />
          <p className="text-sm">No briefing yet for today</p>
          <button
            onClick={() => regenerateMutation.mutate()}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            {regenerateMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Sun size={15} />}
            Generate Briefing
          </button>
        </div>
      )}
    </div>
  );
}
