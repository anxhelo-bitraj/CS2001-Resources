import axiosClient from './axiosClient';
import type { FollowUpReminder } from '../../shared/types';

export const reminderApi = {
  list: () =>
    axiosClient.get<FollowUpReminder[]>('/reminders'),

  create: (data: { emailId: string; remindAt: number; note?: string }) =>
    axiosClient.post<FollowUpReminder>('/reminders', data),

  update: (id: number, data: { remindAt?: number; isTriggered?: boolean }) =>
    axiosClient.patch<FollowUpReminder>(`/reminders/${id}`, data),

  delete: (id: number) =>
    axiosClient.delete(`/reminders/${id}`),
};
