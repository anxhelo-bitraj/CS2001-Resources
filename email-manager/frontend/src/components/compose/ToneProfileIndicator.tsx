import { useQuery, useMutation } from '@tanstack/react-query';
import { Brain, Loader2, RefreshCw } from 'lucide-react';
import { aiApi } from '../../api/aiApi';
import toast from 'react-hot-toast';

interface Props {
  contactEmail: string;
}

export default function ToneProfileIndicator({ contactEmail }: Props) {
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['toneProfile', contactEmail],
    queryFn: () => aiApi.getToneProfile(contactEmail),
    select: (r) => r.data,
    enabled: !!contactEmail,
    staleTime: 10 * 60 * 1000,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => aiApi.analyzeTone(contactEmail),
    onSuccess: () => {
      toast.success('Tone profile updated');
      refetch();
    },
    onError: () => toast.error('Could not analyze tone — not enough sent emails to this contact yet'),
  });

  if (!contactEmail) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 size={11} className="animate-spin" />
        Loading tone profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Brain size={11} />
        <span>No tone profile yet</span>
        <button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {analyzeMutation.isPending ? 'Analysing...' : 'Analyse'}
        </button>
      </div>
    );
  }

  const p = profile as Record<string, unknown>;
  const sampleCount = p.sampleCount || p.sample_count || 0;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Brain size={11} className="text-blue-500" />
      <span className="text-blue-600 font-medium">
        Tone learned ({sampleCount as number} email{(sampleCount as number) !== 1 ? 's' : ''} analysed)
      </span>
      <button
        onClick={() => analyzeMutation.mutate()}
        disabled={analyzeMutation.isPending}
        className="text-slate-400 hover:text-slate-600 ml-1"
        title="Re-analyse"
      >
        <RefreshCw size={10} className={analyzeMutation.isPending ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
