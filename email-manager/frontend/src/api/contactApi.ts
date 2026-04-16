import axiosClient from './axiosClient';
import type { Contact, EmailCategory, VipRules } from '../../shared/types';

export const contactApi = {
  list: () =>
    axiosClient.get<Contact[]>('/contacts'),

  get: (email: string) =>
    axiosClient.get<Contact>(`/contacts/${encodeURIComponent(email)}`),

  upsert: (data: Partial<Contact> & { id: string }) =>
    axiosClient.post<Contact>('/contacts', data),

  update: (email: string, data: { category?: EmailCategory; isVip?: boolean; vipRules?: VipRules; responseSlaHours?: number; notes?: string }) =>
    axiosClient.patch<Contact>(`/contacts/${encodeURIComponent(email)}`, data),

  delete: (email: string) =>
    axiosClient.delete(`/contacts/${encodeURIComponent(email)}`),
};
