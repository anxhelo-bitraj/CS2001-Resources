import axiosClient from './axiosClient';
import type { DraftReplyResponse, ReviewScoreResponse, ToneProfile, ActionItem } from '../../shared/types';

export const aiApi = {
  summarize: (emailId: string) =>
    axiosClient.post<{ summary: string; keyPoints: string[] }>(`/ai/summarize/${emailId}`),

  extractTasks: (emailId: string) =>
    axiosClient.post<{ tasks: ActionItem[] }>(`/ai/extract-tasks/${emailId}`),

  draftReply: (emailId: string, data: { userNotes?: string }) =>
    axiosClient.post<DraftReplyResponse>(`/ai/draft-reply/${emailId}`, data),

  getToneProfile: (contactEmail: string) =>
    axiosClient.get<ToneProfile | null>(`/ai/tone-profile/${encodeURIComponent(contactEmail)}`),

  analyzeTone: (contactEmail: string) =>
    axiosClient.post<ToneProfile>('/ai/analyze-tone', { contactEmail }),

  scoreReviewReply: (emailId: string, draft: string) =>
    axiosClient.post<ReviewScoreResponse>('/ai/score-review-reply', { emailId, draft }),

  suggestTemplate: (emailId: string) =>
    axiosClient.post<{ templateId: number; reason: string } | null>(`/ai/suggest-template/${emailId}`),

  detectMeeting: (emailId: string) =>
    axiosClient.get<{ hasMeetingRequest: boolean; proposedTimes?: string[]; subject?: string }>(`/ai/detect-meeting/${emailId}`),
};
