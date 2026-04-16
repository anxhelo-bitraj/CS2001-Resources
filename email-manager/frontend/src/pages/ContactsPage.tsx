import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Star } from 'lucide-react';
import { contactApi } from '../api/contactApi';
import type { Contact, EmailCategory } from '../../shared/types';
import { CATEGORY_LABELS } from '../utils/categoryColors';
import CategoryBadge from '../components/email/CategoryBadge';
import toast from 'react-hot-toast';

const CATEGORIES: EmailCategory[] = ['ceo_board', 'admin_ops', 'guest', 'supplier', 'staff', 'unknown'];

export default function ContactsPage() {
  const queryClient = useQueryClient();

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactApi.list(),
    select: (r) => r.data as Contact[],
  });

  const updateMutation = useMutation({
    mutationFn: ({ email, data }: { email: string; data: Partial<Contact> }) =>
      contactApi.update(email, data),
    onSuccess: () => { toast.success('Contact updated'); queryClient.invalidateQueries({ queryKey: ['contacts'] }); },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
          <Users size={22} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-slate-500">{contacts?.length || 0} contacts · Set categories and VIP status</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-[1fr_160px_100px_80px] px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Contact</span>
          <span>Category</span>
          <span>SLA (hrs)</span>
          <span>VIP</span>
        </div>
        {contacts?.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No contacts yet — sync your inbox to populate</p>
          </div>
        )}
        {contacts?.map((contact) => (
          <div
            key={contact.id}
            className="grid grid-cols-[1fr_160px_100px_80px] items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {contact.displayName || contact.id}
              </p>
              <p className="text-xs text-slate-400 truncate">{contact.id}</p>
            </div>
            <select
              value={contact.category || 'unknown'}
              onChange={(e) => updateMutation.mutate({ email: contact.id, data: { category: e.target.value as EmailCategory } })}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={168}
              value={contact.responseSlaHours || ''}
              onChange={(e) => updateMutation.mutate({ email: contact.id, data: { responseSlaHours: parseInt(e.target.value) || undefined } })}
              placeholder="24"
              className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-16"
            />
            <button
              onClick={() => updateMutation.mutate({ email: contact.id, data: { isVip: !contact.isVip } })}
              className={`p-1.5 rounded-lg transition-colors ${contact.isVip ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-slate-300 hover:text-yellow-400'}`}
            >
              <Star size={16} fill={contact.isVip ? 'currentColor' : 'none'} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
