import axiosClient from './axiosClient';
import type { Email, EmailCategory } from '../../shared/types';

export interface EmailListParams {
  folder?: string;
  category?: EmailCategory;
  page?: number;
  limit?: number;
  search?: string;
}

export const emailApi = {
  list: (params: EmailListParams = {}) =>
    axiosClient.get<{ emails: Email[]; total: number; page: number }>('/emails', { params }),

  get: (id: string) =>
    axiosClient.get<Email>(`/emails/${id}`),

  getThread: (id: string) =>
    axiosClient.get<Email[]>(`/emails/${id}/thread`),

  sync: () =>
    axiosClient.post<{ synced: number }>('/emails/sync'),

  send: (data: { to: string[]; subject: string; body: string }) =>
    axiosClient.post('/emails/send', data),

  reply: (id: string, data: { body: string }) =>
    axiosClient.post(`/emails/${id}/reply`, data),

  forward: (id: string, data: { to: string[]; body: string }) =>
    axiosClient.post(`/emails/${id}/forward`, data),

  markRead: (id: string, isRead: boolean) =>
    axiosClient.patch(`/emails/${id}/read`, { isRead }),

  setCategory: (id: string, category: EmailCategory) =>
    axiosClient.patch(`/emails/${id}/category`, { category }),

  delete: (id: string) =>
    axiosClient.delete(`/emails/${id}`),

  snooze: (id: string, until: number) =>
    axiosClient.post(`/emails/${id}/snooze`, { until }),
};
