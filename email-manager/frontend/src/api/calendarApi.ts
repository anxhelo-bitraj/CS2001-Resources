import axiosClient from './axiosClient';
import type { CalendarEvent } from '../../shared/types';

export const calendarApi = {
  list: (from?: string, to?: string) =>
    axiosClient.get<CalendarEvent[]>('/calendar/events', { params: { from, to } }),

  create: (data: { subject: string; start: string; end: string; location?: string; attendees?: string[] }) =>
    axiosClient.post<CalendarEvent>('/calendar/events', data),

  detectMeeting: (emailId: string) =>
    axiosClient.get(`/calendar/detect/${emailId}`),
};
