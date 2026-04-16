import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { emailApi } from '../../api/emailApi';
import { useEmailStore } from '../../store/emailStore';
import type { Email, EmailCategory } from '../../../shared/types';
import EmailListItem from './EmailListItem';

interface Props {
  category?: EmailCategory;
  folder?: string;
}

export default function EmailList({ category, folder = 'inbox' }: Props) {
  const [search, setSearch] = useState('');
  const { activeEmail, setActiveEmail } = useEmailStore();

  const { data, isLoading } = useQuery({
    queryKey: ['emails', folder, category, search],
    queryFn: () => emailApi.list({ folder, category, search: search || undefined }),
    select: (r) => r.data.emails as Email[],
    refetchInterval: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-col h-full border-r border-slate-200 dark:border-slate-700 w-80 shrink-0 bg-white dark:bg-slate-900">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        ) : !data?.length ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
            <span className="text-2xl">📭</span>
            <p className="text-sm">No emails found</p>
          </div>
        ) : (
          data.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              isActive={activeEmail?.id === email.id}
              onClick={() => setActiveEmail(email)}
            />
          ))
        )}
      </div>
    </div>
  );
}
