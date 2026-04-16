import axiosClient from './axiosClient';
import type { Template, EmailCategory } from '../../shared/types';

export const templateApi = {
  list: (category?: EmailCategory) =>
    axiosClient.get<Template[]>('/templates', { params: { category } }),

  get: (id: number) =>
    axiosClient.get<Template>(`/templates/${id}`),

  create: (data: Omit<Template, 'id' | 'userId' | 'usageCount'>) =>
    axiosClient.post<Template>('/templates', data),

  update: (id: number, data: Partial<Template>) =>
    axiosClient.patch<Template>(`/templates/${id}`, data),

  delete: (id: number) =>
    axiosClient.delete(`/templates/${id}`),

  render: (id: number, variables: Record<string, string>) =>
    axiosClient.post<{ subject: string; body: string }>(`/templates/${id}/render`, { variables }),
};
