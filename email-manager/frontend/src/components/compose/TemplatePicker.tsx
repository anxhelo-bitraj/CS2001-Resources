import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BookTemplate, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { templateApi } from '../../api/templateApi';
import type { Template } from '../../../shared/types';
import toast from 'react-hot-toast';

interface Props {
  onSelect: (subject: string, body: string) => void;
}

export default function TemplatePicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateApi.list(),
    select: (r) => r.data as Template[],
  });

  const filtered = templates?.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (t: Template) => {
    setSelected(t);
    const vars = t.variables || [];
    if (vars.length === 0) {
      const r = await templateApi.render(t.id, {});
      onSelect(r.data.subject, r.data.body);
      setOpen(false);
      toast.success(`Template applied: ${t.name}`);
    }
  };

  const handleRender = async () => {
    if (!selected) return;
    try {
      const r = await templateApi.render(selected.id, variables);
      onSelect(r.data.subject, r.data.body);
      setOpen(false);
      setSelected(null);
      setVariables({});
      toast.success(`Template applied: ${selected.name}`);
    } catch {
      toast.error('Failed to render template');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
      >
        <BookTemplate size={13} />
        Templates
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setSelected(null); }} />
          <div className="absolute bottom-full mb-1 left-0 z-20 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
            {!selected ? (
              <>
                <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search templates..."
                      className="w-full pl-6 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto scrollbar-thin">
                  {filtered?.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelect(t)}
                      className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors border-b border-slate-100 dark:border-slate-700"
                    >
                      <BookTemplate size={12} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{t.name}</p>
                        {t.category && (
                          <p className="text-[10px] text-slate-500 capitalize">{t.category.replace('_', ' ')}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selected.name}</p>
                <p className="text-xs text-slate-500">Fill in the variables:</p>
                {(selected.variables || []).map((v: string) => (
                  <div key={v}>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-medium capitalize">
                      {v.replace(/_/g, ' ')}
                    </label>
                    <input
                      value={variables[v] || ''}
                      onChange={(e) => setVariables((prev) => ({ ...prev, [v]: e.target.value }))}
                      className="w-full mt-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRender}
                    className="flex-1 text-xs bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Use Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-xs text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
