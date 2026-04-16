import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { emailApi } from '../../api/emailApi';
import type { Email } from '../../../shared/types';
import RichTextEditor from './RichTextEditor';
import DraftAssistant from './DraftAssistant';
import TemplatePicker from './TemplatePicker';
import ToneProfileIndicator from './ToneProfileIndicator';

interface Props {
  email: Email;
  onClose: () => void;
}

export default function ReplyPanel({ email, onClose }: Props) {
  const [body, setBody] = useState('');
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: () => emailApi.reply(email.id, { body }),
    onSuccess: () => {
      toast.success('Reply sent');
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      onClose();
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const contactEmail = email.from?.email || '';

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Reply to {email.from?.name || contactEmail}
          </span>
          <ToneProfileIndicator contactEmail={contactEmail} />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <DraftAssistant
        emailId={email.id}
        isGuestEmail={email.aiCategory === 'guest'}
        onDraftGenerated={setBody}
      />

      <RichTextEditor
        content={body}
        onChange={setBody}
        placeholder="Write your reply..."
        minHeight="120px"
      />

      <div className="flex items-center justify-between">
        <TemplatePicker onSelect={(_subject, tmplBody) => setBody(tmplBody)} />

        <button
          onClick={() => replyMutation.mutate()}
          disabled={!body.trim() || replyMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
        >
          {replyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Send Reply
        </button>
      </div>
    </div>
  );
}
