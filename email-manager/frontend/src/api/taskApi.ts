import axiosClient from './axiosClient';
import type { Task, TaskPriority } from '../../shared/types';

export const taskApi = {
  list: (params?: { done?: boolean; priority?: TaskPriority }) =>
    axiosClient.get<Task[]>('/tasks', { params }),

  create: (data: { description: string; dueDate?: number; priority: TaskPriority; emailId?: string }) =>
    axiosClient.post<Task>('/tasks', data),

  update: (id: number, data: { isDone?: boolean; dueDate?: number; priority?: TaskPriority; description?: string }) =>
    axiosClient.patch<Task>(`/tasks/${id}`, data),

  delete: (id: number) =>
    axiosClient.delete(`/tasks/${id}`),
};
