import { useQuery } from '@tanstack/react-query';
import { BarChart2, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import axiosClient from '../api/axiosClient';
import type { AnalyticsResponseTime, SentimentTrend } from '../../shared/types';
import { CATEGORY_LABELS } from '../utils/categoryColors';
import type { EmailCategory } from '../../shared/types';

export default function AnalyticsPage() {
  const { data: responseTimes } = useQuery({
    queryKey: ['analytics', 'response-times'],
    queryFn: () => axiosClient.get<AnalyticsResponseTime[]>('/analytics/response-times'),
    select: (r) => r.data.map((d) => ({
      ...d,
      category: CATEGORY_LABELS[d.category as EmailCategory] || d.category,
      avgHours: d.avgMinutes ? Math.round(d.avgMinutes / 60 * 10) / 10 : 0,
    })),
  });

  const { data: sentiment } = useQuery({
    queryKey: ['analytics', 'sentiment'],
    queryFn: () => axiosClient.get<SentimentTrend[]>('/analytics/sentiment?days=14'),
    select: (r) => r.data,
  });

  const { data: reviewScores } = useQuery({
    queryKey: ['analytics', 'review-scores'],
    queryFn: () => axiosClient.get<Array<{ date: string; avgScore: number; count: number }>>('/analytics/review-scores'),
    select: (r) => r.data,
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
          <BarChart2 size={22} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500">Response times, sentiment trends, and review scores</p>
        </div>
      </div>

      {/* Response Time */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Average Response Time by Category (hours)</h2>
        </div>
        {responseTimes && responseTimes.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={responseTimes} barSize={32}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}h`, 'Avg Response']} />
              <Bar dataKey="avgHours" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No response time data yet — start replying to emails</p>
        )}
      </div>

      {/* Sentiment */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Email Sentiment (14 days)</h2>
        </div>
        {sentiment && sentiment.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sentiment}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="positive" stroke="#22c55e" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="neutral" stroke="#94a3b8" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="negative" stroke="#ef4444" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="urgent" stroke="#f97316" dot={false} strokeWidth={2} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No sentiment data yet — sync emails to start tracking</p>
        )}
      </div>

      {/* Review Scores */}
      {reviewScores && reviewScores.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">⭐</span>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Guest Review Reply Quality</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={reviewScores}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}/100`, 'Avg Score']} />
              <Line type="monotone" dataKey="avgScore" stroke="#6366f1" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
