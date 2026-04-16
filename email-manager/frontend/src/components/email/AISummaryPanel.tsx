import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, ChevronDown, ChevronUp, Loader2, ListChecks } from 'lucide-react';
import { aiApi } from '../../api/aiApi';
import { taskApi } from '../../api/taskApi';
import toast from 'react-hot-toast';

interface Props {
  emailId: string;
  existingSummary?: string;
  existingActionItems?: Array<{ task: string; dueDate?: string }>;
  aiCategory?: string;
}

export default function AISummaryPanel({ emailId, existingSummary, existingActionItems, aiCategory }: Props) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(existingSummary || '');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [tasks, setTasks] = useState(existingActionItems || []);
  const queryClient = useQueryClient();

  const summarizeMutation = useMutation({
    mutationFn: () => aiApi.summarize(emailId),
    onSuccess: (r) => {
      setSummary(r.data.summary);
      setKeyPoints(r.data.keyPoints);
    },
    onError: () => toast.error('Failed to summarize'),
  });

  const extractMutation = useMutation({
    mutationFn: () => aiApi.extractTasks(emailId),
    onSuccess: (r) => {
      setTasks(r.data.tasks);
      if (r.data.tasks.length > 0) {
        toast.success(`${r.data.tasks.length} task${r.data.tasks.length > 1 ? 's' : ''} extracted`);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else {
        toast('No action items found in this email');
      }
    },
    onError: () => toast.error('Failed to extract tasks'),
  });

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50">
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <Sparkles size={14} className="text-blue-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">AI Tools</span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => summarizeMutation.mutate()}
              disabled={summarizeMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {summarizeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Summarise
            </button>
            <button
              onClick={() => extractMutation.mutate()}
              disabled={extractMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-slate-700 text-white px-3 py-1.5 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              {extractMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <ListChecks size={12} />}
              Extract Tasks
            </button>
          </div>

          {summary && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Summary</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{summary}</p>
              {keyPoints.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {keyPoints.map((kp, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                      <span className="text-blue-500 shrink-0">•</span>
                      {kp}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Action Items</p>
              <ul className="space-y-1">
                {tasks.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-500 shrink-0">→</span>
                    <span className="text-slate-700 dark:text-slate-200">{t.task}</span>
                    {t.dueDate && <span className="text-xs text-slate-400 shrink-0">by {t.dueDate}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiCategory === 'guest' && (
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Sparkles size={11} />
              Guest email — reply draft will be quality-scored automatically
            </p>
          )}
        </div>
      )}
    </div>
  );
}
