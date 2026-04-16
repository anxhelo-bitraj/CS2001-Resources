export type EmailCategory = 'ceo_board' | 'admin_ops' | 'guest' | 'supplier' | 'staff' | 'unknown';
export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'deleted';
export type EmailSentiment = 'positive' | 'neutral' | 'negative' | 'urgent';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskSource = 'ai_extracted' | 'manual';

export interface User {
  id: string;
  email: string;
  displayName: string;
  settings?: UserSettings;
}

export interface UserSettings {
  briefingTime: string;
  notificationEnabled: boolean;
  darkMode: boolean;
  slaDefaults: Record<EmailCategory, number>;
}

export interface EmailContact {
  email: string;
  name?: string;
}

export interface Email {
  id: string;
  internetMessageId?: string;
  conversationId?: string;
  from: EmailContact;
  to: EmailContact[];
  subject: string;
  bodyPreview: string;
  bodyHtml?: string;
  bodyText?: string;
  folder: EmailFolder;
  isRead: boolean;
  hasAttachments: boolean;
  receivedAt: number;
  sentAt?: number;
  importance?: string;
  aiCategory?: EmailCategory;
  aiSummary?: string;
  aiSentiment?: EmailSentiment;
  aiPriorityScore?: number;
  actionItems?: ActionItem[];
  hasMeetingRequest?: boolean;
}

export interface ActionItem {
  task: string;
  dueDate?: string;
  assignee?: string;
}

export interface Contact {
  id: string;
  userId: string;
  displayName?: string;
  category: EmailCategory;
  isVip: boolean;
  vipRules?: VipRules;
  responseSlaHours?: number;
  notes?: string;
}

export interface VipRules {
  alwaysNotify: boolean;
  customSla?: number;
  autoLabel?: string;
  notes?: string;
}

export interface LinguisticProfile {
  greetingStyle: string;
  signOff: string;
  avgSentenceLength: 'short' | 'medium' | 'long';
  formality: 'formal' | 'semi-formal' | 'casual';
  usesContractions: boolean;
  commonPhrases: string[];
  avgWordCount: number;
  punctuationStyle: string;
  paragraphCount: number;
  openingPatterns: string[];
  bulletPointUsage: boolean;
  urgencyMarkers: string[];
}

export interface ToneProfile {
  id: number;
  userId: string;
  contactEmail: string;
  lastAnalyzedAt?: number;
  sampleCount: number;
  linguisticProfile: LinguisticProfile;
}

export interface Task {
  id: number;
  userId: string;
  emailId?: string;
  description: string;
  dueDate?: number;
  isDone: boolean;
  priority: TaskPriority;
  source: TaskSource;
  createdAt: number;
}

export interface Template {
  id: number;
  userId: string;
  name: string;
  category?: EmailCategory;
  subjectTemplate?: string;
  bodyTemplate: string;
  variables: string[];
  usageCount: number;
}

export interface FollowUpReminder {
  id: number;
  userId: string;
  emailId: string;
  remindAt: number;
  note?: string;
  isTriggered: boolean;
}

export interface DraftReplyRequest {
  userNotes?: string;
}

export interface DraftReplyResponse {
  draft: string;
  toneMatchConfidence: 'high' | 'medium' | 'low' | 'none';
  profileUsed?: ToneProfile;
}

export interface ReviewScoreResponse {
  score: number;
  notes: string;
  improvements: string[];
}

export interface BriefingData {
  date: string;
  content: string;
  emailCount: number;
  taskCount: number;
}

export interface CalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  location?: string;
  isOnlineMeeting?: boolean;
  attendees?: string[];
}

export interface AnalyticsResponseTime {
  category: EmailCategory;
  avgMinutes: number;
  count: number;
  withinSlaPercent: number;
}

export interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  urgent: number;
}
