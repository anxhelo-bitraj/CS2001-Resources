import type { Email } from '../../../shared/types';
import { formatEmailDate, initials, truncate } from '../../utils/emailUtils';
import CategoryBadge from './CategoryBadge';
import { Paperclip } from 'lucide-react';

interface Props {
  email: Email;
  isActive: boolean;
  onClick: () => void;
}

const PRIORITY_COLORS: Record<number, string> = {
  0: '',
  70: 'border-l-orange-400',
  90: 'border-l-red-500',
};

function priorityBorder(score: number = 0): string {
  if (score >= 90) return 'border-l-4 border-l-red-500';
  if (score >= 70) return 'border-l-4 border-l-orange-400';
  return 'border-l-4 border-l-transparent';
}

export default function EmailListItem({ email, isActive, onClick }: Props) {
  const from = email.from?.name || email.from?.email || 'Unknown';
  const time = formatEmailDate(email.receivedAt);
  const avatarText = initials(from);

  return (
    <div
      onClick={onClick}
      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 ${priorityBorder(email.aiPriorityScore)} ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      } ${!email.isRead ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/30'}`}
    >
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {avatarText}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
            {truncate(from, 24)}
          </span>
          <span className="text-xs text-slate-400 shrink-0">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {!email.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
          <span className={`text-xs truncate ${!email.isRead ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
            {truncate(email.subject || '(no subject)', 50)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {email.aiCategory && <CategoryBadge category={email.aiCategory} />}
          {email.aiSentiment === 'urgent' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
              URGENT
            </span>
          )}
          {email.hasAttachments && <Paperclip size={11} className="text-slate-400" />}
          {email.hasMeetingRequest && (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-medium">
              Meeting
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
