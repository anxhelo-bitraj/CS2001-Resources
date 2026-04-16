import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import type { LinguisticProfile } from '../../../shared/types';

dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';

// ─── Email Categorization ────────────────────────────────────────────────────

export interface CategorizationInput {
  id: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  bodyPreview: string;
}

export interface CategorizationResult {
  id: string;
  category: string;
  sentiment: string;
  priorityScore: number;
  hasMeetingRequest: boolean;
}

export async function categorizeEmails(emails: CategorizationInput[]): Promise<CategorizationResult[]> {
  if (emails.length === 0) return [];

  const emailList = emails.map((e, i) =>
    `[${i + 1}] ID: ${e.id}\nFrom: ${e.fromName} <${e.fromEmail}>\nSubject: ${e.subject}\nPreview: ${e.bodyPreview}`
  ).join('\n\n---\n\n');

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are an email categorization assistant for a restaurant general manager.
Categorize each email into EXACTLY one of these categories:
- ceo_board: Emails from CEO, board members, directors, owners, investors
- admin_ops: Administrative, HR, payroll, accounting, compliance, council, legal, insurance
- guest: Customer enquiries, reservations, complaints, reviews, feedback
- supplier: Food/beverage suppliers, equipment, maintenance contractors, utilities
- staff: Employees, shift requests, absences, payroll queries, team matters
- unknown: Does not fit any category above

Also rate sentiment: positive / neutral / negative / urgent
And priority score: 0-100 (100 = most urgent)
Detect if email contains a meeting request.

Return ONLY valid JSON array, no markdown:
[{"id":"...","category":"...","sentiment":"...","priorityScore":0,"hasMeetingRequest":false}]`,
    messages: [{ role: 'user', content: `Categorize these emails:\n\n${emailList}` }],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(text);
  } catch {
    return emails.map((e) => ({
      id: e.id,
      category: 'unknown',
      sentiment: 'neutral',
      priorityScore: 0,
      hasMeetingRequest: false,
    }));
  }
}

// ─── Summarization ───────────────────────────────────────────────────────────

export async function summarizeEmail(subject: string, body: string): Promise<{ summary: string; keyPoints: string[] }> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are an executive assistant summarizing emails for a busy restaurant general manager.
Return ONLY valid JSON: {"summary":"2-3 sentence summary","keyPoints":["point1","point2","point3"]}
Be concise and action-oriented. No markdown.`,
    messages: [{
      role: 'user',
      content: `Subject: ${subject}\n\n${body.slice(0, 3000)}`,
    }],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(text);
  } catch {
    return { summary: 'Unable to summarize this email.', keyPoints: [] };
  }
}

// ─── Action Item Extraction ───────────────────────────────────────────────────

export async function extractActionItems(subject: string, body: string): Promise<Array<{ task: string; dueDate?: string; assignee?: string }>> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `Extract action items and tasks from the email. Focus on requests, deadlines, and commitments.
Return ONLY valid JSON array: [{"task":"description","dueDate":"YYYY-MM-DD or null","assignee":"name or null"}]
If no tasks found, return [].`,
    messages: [{
      role: 'user',
      content: `Subject: ${subject}\n\n${body.slice(0, 3000)}`,
    }],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ─── Tone Analysis ────────────────────────────────────────────────────────────

export async function analyzeTone(emailSamples: string[]): Promise<LinguisticProfile> {
  const samples = emailSamples.slice(0, 20).map((s, i) => `--- Email ${i + 1} ---\n${s}`).join('\n\n');

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are a linguistic analyst. Analyze the writing style of these emails written by the same person.
Extract their characteristic writing patterns and return ONLY valid JSON matching this exact structure:
{
  "greetingStyle": "e.g. Hi [name], or Dear [name],",
  "signOff": "e.g. Best regards, or Thanks,",
  "avgSentenceLength": "short|medium|long",
  "formality": "formal|semi-formal|casual",
  "usesContractions": true,
  "commonPhrases": ["phrase1","phrase2"],
  "avgWordCount": 100,
  "punctuationStyle": "minimal|standard|heavy",
  "paragraphCount": 2,
  "openingPatterns": ["pattern1","pattern2"],
  "bulletPointUsage": false,
  "urgencyMarkers": ["ASAP","urgent"]
}
No markdown, only JSON.`,
    messages: [{ role: 'user', content: `Analyze writing style from these sent emails:\n\n${samples}` }],
  });

  const defaults: LinguisticProfile = {
    greetingStyle: 'Hi,',
    signOff: 'Kind regards',
    avgSentenceLength: 'medium',
    formality: 'semi-formal',
    usesContractions: true,
    commonPhrases: [],
    avgWordCount: 100,
    punctuationStyle: 'standard',
    paragraphCount: 2,
    openingPatterns: [],
    bulletPointUsage: false,
    urgencyMarkers: [],
  };

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return { ...defaults, ...JSON.parse(text) };
  } catch {
    return defaults;
  }
}

// ─── Draft Reply ──────────────────────────────────────────────────────────────

export async function draftReply(
  originalEmail: { subject: string; from: string; body: string },
  toneProfile: LinguisticProfile | null,
  userNotes: string,
  isGuestReview = false
): Promise<{ draft: string; toneMatchConfidence: 'high' | 'medium' | 'low' | 'none' }> {
  let styleGuidance = '';
  let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';

  if (toneProfile) {
    confidence = toneProfile.avgWordCount > 0 ? 'high' : 'medium';
    styleGuidance = `
WRITING STYLE PROFILE (mirror this exactly):
- Greeting: Use "${toneProfile.greetingStyle}"
- Sign-off: Use "${toneProfile.signOff}"
- Formality: ${toneProfile.formality}
- Average email length: ~${toneProfile.avgWordCount} words
- Sentence length: ${toneProfile.avgSentenceLength}
- Use contractions: ${toneProfile.usesContractions ? 'yes' : 'no'}
- Characteristic phrases to weave in naturally: ${toneProfile.commonPhrases.join(', ') || 'none'}
- Opening patterns: ${toneProfile.openingPatterns.join(', ') || 'standard'}
- Use bullet points: ${toneProfile.bulletPointUsage ? 'yes' : 'no'}
`;
  }

  const guestGuidance = isGuestReview
    ? '\nThis is a guest/customer email. Be warm, empathetic, professional and resolution-focused.'
    : '';

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are ghostwriting an email reply for a restaurant general manager.
${styleGuidance}${guestGuidance}
Write ONLY the email body — no subject line, no "Subject:", no explanation.
Start directly with the greeting.`,
    messages: [{
      role: 'user',
      content: `Original email from ${originalEmail.from}:
Subject: ${originalEmail.subject}

${originalEmail.body.slice(0, 2000)}

---
GM's notes for the reply: ${userNotes || 'No additional notes — just reply professionally.'}`,
    }],
  });

  const draft = message.content[0].type === 'text' ? message.content[0].text : '';
  return { draft, toneMatchConfidence: confidence };
}

// ─── Guest Review Quality Score ───────────────────────────────────────────────

export async function scoreGuestReviewReply(
  originalEmail: string,
  draft: string
): Promise<{ score: number; notes: string; improvements: string[] }> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a hospitality expert scoring a restaurant's email reply to a guest review or complaint.
Score on: empathy (25pts), specificity to their concern (25pts), professional tone (25pts), resolution offered (25pts).
Return ONLY valid JSON: {"score":85,"notes":"brief explanation","improvements":["suggestion1","suggestion2"]}`,
    messages: [{
      role: 'user',
      content: `Original guest message:\n${originalEmail.slice(0, 1000)}\n\nProposed reply:\n${draft.slice(0, 1000)}`,
    }],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(text);
  } catch {
    return { score: 0, notes: 'Could not score reply.', improvements: [] };
  }
}

// ─── Template Suggestion ──────────────────────────────────────────────────────

export async function suggestTemplate(
  email: { subject: string; fromEmail: string; bodyPreview: string },
  templates: Array<{ id: number; name: string; category: string | null; bodyTemplate: string }>
): Promise<{ templateId: number; reason: string } | null> {
  if (templates.length === 0) return null;

  const templateList = templates
    .slice(0, 15)
    .map((t) => `ID:${t.id} "${t.name}" (${t.category || 'general'})`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `You are a restaurant email assistant. Given an incoming email, suggest the most appropriate reply template.
Return ONLY valid JSON: {"templateId":1,"reason":"brief reason"} or null if none suitable.`,
    messages: [{
      role: 'user',
      content: `Incoming email:
From: ${email.fromEmail}
Subject: ${email.subject}
Preview: ${email.bodyPreview}

Available templates:
${templateList}`,
    }],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    if (text.trim() === 'null') return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ─── Meeting Detection ────────────────────────────────────────────────────────

export async function detectMeetingRequest(
  subject: string,
  body: string
): Promise<{ hasMeetingRequest: boolean; proposedTimes?: string[]; suggestedTitle?: string }> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `Detect if this email contains a meeting, call, or appointment request.
Return ONLY valid JSON: {"hasMeetingRequest":true,"proposedTimes":["Monday 2pm","Tuesday morning"],"suggestedTitle":"Meeting title"}
If no meeting request: {"hasMeetingRequest":false}`,
    messages: [{ role: 'user', content: `Subject: ${subject}\n\n${body.slice(0, 2000)}` }],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(text);
  } catch {
    return { hasMeetingRequest: false };
  }
}

// ─── Morning Briefing ─────────────────────────────────────────────────────────

export async function generateMorningBriefing(data: {
  urgentEmails: Array<{ subject: string; from: string; preview: string }>;
  pendingTasks: Array<{ description: string; priority: string; dueDate?: string }>;
  overdueFollowUps: number;
  calendarEvents: Array<{ subject: string; start: string; end: string }>;
  emailStats: { total: number; unread: number; byCategory: Record<string, number> };
  date: string;
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are an executive assistant creating a morning briefing for a restaurant general manager.
Create a concise, well-structured HTML briefing. Use clean HTML with inline styles.
Include sections: Good Morning greeting, Today's Priority Emails, Pending Tasks, Today's Calendar, Quick Stats.
Keep it scannable — use bold headings, bullet points, highlight urgent items in red.`,
    messages: [{
      role: 'user',
      content: JSON.stringify(data),
    }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '<p>Briefing unavailable.</p>';
}

// ─── Staff Absence Detection ──────────────────────────────────────────────────

export async function detectStaffAbsence(
  subject: string,
  body: string,
  fromName: string
): Promise<{ isAbsence: boolean; absenceType?: string; dates?: string[] }> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `Detect if this email is a staff absence notification (sick, late, holiday request, personal day etc).
Return ONLY valid JSON: {"isAbsence":true,"absenceType":"sick","dates":["today","tomorrow"]} or {"isAbsence":false}`,
    messages: [{ role: 'user', content: `From: ${fromName}\nSubject: ${subject}\n\n${body.slice(0, 1000)}` }],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(text);
  } catch {
    return { isAbsence: false };
  }
}

// ─── Supplier Price Alert ─────────────────────────────────────────────────────

export async function detectSupplierPriceChange(
  subject: string,
  body: string
): Promise<{ hasPriceChange: boolean; items?: Array<{ item: string; changePercent?: string }> }> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `Detect if this supplier email mentions price changes, price increases, or new pricing.
Return ONLY valid JSON: {"hasPriceChange":true,"items":[{"item":"beef","changePercent":"+8%"}]} or {"hasPriceChange":false}`,
    messages: [{ role: 'user', content: `Subject: ${subject}\n\n${body.slice(0, 2000)}` }],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(text);
  } catch {
    return { hasPriceChange: false };
  }
}
