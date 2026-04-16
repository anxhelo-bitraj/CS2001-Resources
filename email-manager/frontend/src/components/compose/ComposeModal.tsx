import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { emailApi } from '../../api/emailApi';
import { useUiStore } from '../../store/uiStore';
import RichTextEditor from './RichTextEditor';
import TemplatePicker from './TemplatePicker';

export default function ComposeModal() {
  const setComposeOpen = useUiStore((s) => s.setComposeOpen);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const sendMutation = useMutation({
    mutationFn: () =>
      emailApi.send({
        to: to.split(',').map((e) => e.trim()).filter(Boolean),
        subject,
        body,
      }),
    onSuccess: () => {
      toast.success('Email sent');
      setComposeOpen(false);
    },
    onError: () => toast.error('Failed to send email'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <span className="font-semibold text-slate-800 dark:text-white">New Email</span>
          <button
            onClick={() => setComposeOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">To</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com (comma-separated)"
              className="w-full mt-1 text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full mt-1 text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Message</label>
            <div className="mt-1">
              <RichTextEditor content={body} onChange={setBody} minHeight="200px" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <TemplatePicker onSelect={(s, b) => { if (s) setSubject(s); setBody(b); }} />
          <button
            onClick={() => sendMutation.mutate()}
            disabled={!to.trim() || !subject.trim() || !body.trim() || sendMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
          >
            {sendMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
