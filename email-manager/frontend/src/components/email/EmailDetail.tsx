import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Reply, Forward, Trash2, Clock, Mail, MailOpen, Calendar, Loader2 } from 'lucide-react';
import { useState } from 'react';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import { emailApi } from '../../api/emailApi';
import { aiApi } from '../../api/aiApi';
import { useEmailStore } from '../../store/emailStore';
import { useUiStore } from '../../store/uiStore';
import type { Email } from '../../../shared/types';
import CategoryBadge from './CategoryBadge';
import AISummaryPanel from './AISummaryPanel';
import ReplyPanel from '../compose/ReplyPanel';
import { formatEmailDate } from '../../utils/emailUtils';

export default function EmailDetail() {
  const { activeEmail } = useEmailStore();
  const { replyPanelOpen, setReplyPanelOpen } = useUiStore();
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const queryClient = useQueryClient();

  const { data: fullEmail } = useQuery({
    queryKey: ['email', activeEmail?.id],
    queryFn: () => emailApi.get(activeEmail!.id),
    enabled: !!activeEmail,
    select: (r) => r.data as Email,
  });

  const { data: meetingDetection } = useQuery({
    queryKey: ['meeting', activeEmail?.id],
    queryFn: () => aiApi.detectMeeting(activeEmail!.id),
    enabled: !!activeEmail && !!activeEmail.hasMeetingRequest,
    select: (r) => r.data,
  });

  const markReadMutation = useMutation({
    mutationFn: (isRead: boolean) => emailApi.markRead(activeEmail!.id, isRead),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emails'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => emailApi.delete(activeEmail!.id),
    onSuccess: () => {
      toast.success('Email deleted');
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
    onError: () => toast.error('Failed to delete email'),
  });

  const snoozeMutation = useMutation({
    mutationFn: () => emailApi.snooze(activeEmail!.id, Math.floor(new Date(reminderDate).getTime() / 1000)),
    onSuccess: () => {
      toast.success('Email snoozed');
      setShowReminderPicker(false);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  if (!activeEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-50 dark:bg-slate-900/50">
        <span className="text-5xl">📧</span>
        <p className="text-sm">Select an email to read</p>
      </div>
    );
  }

  const email = fullEmail || activeEmail;
  const safeHtml = email.bodyHtml ? DOMPurify.sanitize(email.bodyHtml) : null;
  const actionItems = typeof email.actionItems === 'string'
    ? JSON.parse(email.actionItems as unknown as string)
    : email.actionItems;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug flex-1">
            {email.subject || '(no subject)'}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            {email.aiCategory && <CategoryBadge category={email.aiCategory} size="md" />}
            {email.aiSentiment === 'urgent' && (
              <span className="text-xs font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                URGENT
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {(email.from?.name || email.from?.email || '?')[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {email.from?.name || email.from?.email}
            </span>
            {email.from?.name && (
              <span className="ml-2 text-slate-400 text-xs">&lt;{email.from.email}&gt;</span>
            )}
          </div>
          <span className="shrink-0 text-xs">{formatEmailDate(email.receivedAt)}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <button
          onClick={() => setReplyPanelOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Reply size={13} /> Reply
        </button>
        <button
          onClick={() => markReadMutation.mutate(!email.isRead)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          {email.isRead ? <Mail size={13} /> : <MailOpen size={13} />}
          {email.isRead ? 'Mark Unread' : 'Mark Read'}
        </button>
        <button
          onClick={() => setShowReminderPicker(!showReminderPicker)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Clock size={13} /> Snooze
        </button>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Delete
        </button>

        {showReminderPicker && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="datetime-local"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={() => snoozeMutation.mutate()}
              disabled={!reminderDate}
              className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              Snooze
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
        <AISummaryPanel
          emailId={email.id}
          existingSummary={email.aiSummary}
          existingActionItems={actionItems}
          aiCategory={email.aiCategory}
        />

        {meetingDetection?.hasMeetingRequest && (
          <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <Calendar size={18} className="text-indigo-600" />
            <div className="flex-1 text-sm">
              <span className="font-medium text-indigo-800 dark:text-indigo-200">Meeting request detected</span>
              {meetingDetection.proposedTimes && (
                <p className="text-indigo-600 dark:text-indigo-400 text-xs mt-0.5">
                  Proposed: {meetingDetection.proposedTimes.join(', ')}
                </p>
              )}
            </div>
            <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
              Add to Calendar
            </button>
          </div>
        )}

        {safeHtml ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert text-slate-800 dark:text-slate-200"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {email.bodyText || email.bodyPreview || '(no content)'}
          </p>
        )}
      </div>

      {/* Reply Panel */}
      {replyPanelOpen && (
        <ReplyPanel
          email={email}
          onClose={() => setReplyPanelOpen(false)}
        />
      )}
    </div>
  );
}
