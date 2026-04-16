import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Square, Plus, Trash2, ListTodo } from 'lucide-react';
import { useState } from 'react';
import { taskApi } from '../api/taskApi';
import type { Task } from '../../shared/types';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  low: 'text-green-600 bg-green-50 border-green-200',
};

export default function TasksPage() {
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const queryClient = useQueryClient();

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.list(),
    select: (r) => r.data as Task[],
  });

  const createMutation = useMutation({
    mutationFn: () => taskApi.create({ description: newTask, priority, source: 'manual' } as Parameters<typeof taskApi.create>[0]),
    onSuccess: () => {
      setNewTask('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => toast.error('Failed to create task'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isDone }: { id: number; isDone: boolean }) => taskApi.update(id, { isDone }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const pending = tasks?.filter((t) => !t.isDone) || [];
  const done = tasks?.filter((t) => t.isDone) || [];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
          <ListTodo size={22} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-slate-500">{pending.length} pending · {done.length} completed</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-4 flex gap-2">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newTask.trim()) createMutation.mutate(); }}
          placeholder="Add a task..."
          className="flex-1 text-sm bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
          className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 focus:outline-none"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onClick={() => newTask.trim() && createMutation.mutate()}
          className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {pending.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Pending</p>
          </div>
          {pending.map((task) => (
            <div key={task.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <button onClick={() => toggleMutation.mutate({ id: task.id, isDone: true })} className="text-slate-400 hover:text-blue-500 transition-colors">
                <Square size={18} />
              </button>
              <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">{task.description}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority.toUpperCase()}
              </span>
              {task.source === 'ai_extracted' && (
                <span className="text-[10px] text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">AI</span>
              )}
              <button onClick={() => deleteMutation.mutate(task.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden opacity-60">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed ({done.length})</p>
          </div>
          {done.slice(0, 10).map((task) => (
            <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <button onClick={() => toggleMutation.mutate({ id: task.id, isDone: false })} className="text-green-500 hover:text-slate-400 transition-colors">
                <CheckSquare size={18} />
              </button>
              <span className="flex-1 text-sm text-slate-500 line-through">{task.description}</span>
              <button onClick={() => deleteMutation.mutate(task.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
