import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, Star, AlertCircle } from 'lucide-react';
import { aiApi } from '../../api/aiApi';
import toast from 'react-hot-toast';

interface Props {
  emailId: string;
  isGuestEmail?: boolean;
  onDraftGenerated: (draft: string) => void;
}

export default function DraftAssistant({ emailId, isGuestEmail, onDraftGenerated }: Props) {
  const [notes, setNotes] = useState('');
  const [reviewScore, setReviewScore] = useState<{ score: number; notes: string; improvements: string[] } | null>(null);
  const [lastDraft, setLastDraft] = useState('');
  const [toneConfidence, setToneConfidence] = useState<string>('');

  const draftMutation = useMutation({
    mutationFn: () => aiApi.draftReply(emailId, { userNotes: notes }),
    onSuccess: (r) => {
      onDraftGenerated(r.data.draft);
      setLastDraft(r.data.draft);
      setToneConfidence(r.data.toneMatchConfidence);
      toast.success('Draft generated');
    },
    onError: () => toast.error('Failed to generate draft'),
  });

  const scoreMutation = useMutation({
    mutationFn: () => aiApi.scoreReviewReply(emailId, lastDraft),
    onSuccess: (r) => setReviewScore(r.data),
    onError: () => toast.error('Failed to score reply'),
  });

  const confidenceColor = {
    high: 'text-green-600',
    medium: 'text-yellow-600',
    low: 'text-orange-600',
    none: 'text-slate-500',
  }[toneConfidence] || 'text-slate-500';

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Draft Assistant</p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes for the AI (key points to include, tone direction...)"
        rows={2}
        className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => draftMutation.mutate()}
          disabled={draftMutation.isPending}
          className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
        >
          {draftMutation.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          {draftMutation.isPending ? 'Generating...' : 'Draft with AI'}
        </button>

        {isGuestEmail && lastDraft && (
          <button
            onClick={() => scoreMutation.mutate()}
            disabled={scoreMutation.isPending}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
          >
            {scoreMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
            Score Reply
          </button>
        )}

        {toneConfidence && (
          <span className={`text-xs ${confidenceColor} flex items-center gap-1`}>
            <Sparkles size={10} />
            Tone match: {toneConfidence}
          </span>
        )}
      </div>

      {reviewScore && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2 mb-1.5">
            <Star size={14} className="text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
              Reply Score: {reviewScore.score}/100
            </span>
            <div className="flex-1 bg-indigo-200 dark:bg-indigo-800 rounded-full h-1.5">
              <div
                className="bg-indigo-600 rounded-full h-1.5 transition-all"
                style={{ width: `${reviewScore.score}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-2">{reviewScore.notes}</p>
          {reviewScore.improvements.length > 0 && (
            <ul className="space-y-1">
              {reviewScore.improvements.map((imp, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                  <AlertCircle size={11} className="shrink-0 mt-0.5" />
                  {imp}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
