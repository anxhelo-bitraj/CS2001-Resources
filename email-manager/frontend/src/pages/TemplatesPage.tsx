import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookTemplate, Plus, Trash2, Edit3, X, Save } from 'lucide-react';
import { useState } from 'react';
import { templateApi } from '../api/templateApi';
import type { Template } from '../../shared/types';
import toast from 'react-hot-toast';
import CategoryBadge from '../components/email/CategoryBadge';

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateApi.list(),
    select: (r) => r.data as Template[],
  });

  const deleteMutation = useMutation({
    mutationFn: templateApi.delete,
    onSuccess: () => { toast.success('Template deleted'); queryClient.invalidateQueries({ queryKey: ['templates'] }); },
  });

  const saveMutation = useMutation({
    mutationFn: async (t: Partial<Template>) => {
      if (t.id) {
        return templateApi.update(t.id, t);
      }
      return templateApi.create({ name: t.name!, bodyTemplate: t.bodyTemplate!, category: t.category, variables: t.variables || [] } as Parameters<typeof templateApi.create>[0]);
    },
    onSuccess: () => {
      toast.success('Template saved');
      setEditing(null);
      setIsNew(false);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => toast.error('Failed to save template'),
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
            <BookTemplate size={22} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Email Templates</h1>
            <p className="text-sm text-slate-500">{templates?.length || 0} templates</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing({ name: '', bodyTemplate: '', variables: [] }); setIsNew(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates?.map((t) => (
          <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <BookTemplate size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{t.name}</p>
                  {t.category && <CategoryBadge category={t.category as Parameters<typeof CategoryBadge>[0]['category']} />}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditing({ ...t }); setIsNew(false); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(t.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{t.bodyTemplate}</p>
            {t.variables && t.variables.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {t.variables.map((v: string) => (
                  <span key={v} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-white">{isNew ? 'New Template' : 'Edit Template'}</span>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</label>
                <input
                  value={editing.name || ''}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                  className="w-full mt-1 text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Body</label>
                <textarea
                  value={editing.bodyTemplate || ''}
                  onChange={(e) => setEditing((p) => ({ ...p, bodyTemplate: e.target.value }))}
                  rows={8}
                  className="w-full mt-1 text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
                  placeholder="Use {{variable_name}} for placeholders"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate(editing)}
                disabled={!editing.name || !editing.bodyTemplate}
                className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
