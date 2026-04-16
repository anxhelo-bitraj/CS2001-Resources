import { getSentEmailsToContact } from '../db/queries/emailQueries';
import { getToneProfile, upsertToneProfile } from '../db/queries/toneQueries';
import { analyzeTone } from './aiService';
import { getSentEmailsToContact as graphGetSentEmails } from './graphService';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;

function stripHtml(html: string): string {
  try {
    const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
    return clean.replace(/\s+/g, ' ').trim();
  } catch {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

function truncateText(text: string, maxChars = 400): string {
  return text.length > maxChars ? text.slice(0, maxChars) + '...' : text;
}

const STALE_DAYS = 30;
const MIN_SAMPLES_FOR_ANALYSIS = 3;
const REANALYSIS_THRESHOLD = 5;

export async function getToneProfileForContact(
  userId: string,
  contactEmail: string,
  accessToken?: string
) {
  const existing = getToneProfile(userId, contactEmail) as Record<string, unknown> | undefined;

  if (existing) {
    const lastAnalyzed = existing.last_analyzed_at as number;
    const staleCutoff = Math.floor(Date.now() / 1000) - STALE_DAYS * 86400;
    if (lastAnalyzed && lastAnalyzed > staleCutoff) {
      return {
        ...existing,
        linguisticProfile: JSON.parse(existing.linguistic_profile as string),
      };
    }
  }

  return analyzeToneForContact(userId, contactEmail, accessToken);
}

export async function analyzeToneForContact(
  userId: string,
  contactEmail: string,
  accessToken?: string
) {
  const dbEmails = getSentEmailsToContact(userId, contactEmail, 20) as Array<Record<string, unknown>>;

  let allSamples: string[] = dbEmails
    .map((e) => {
      const html = e.body_html as string | null;
      const text = e.body_text as string | null;
      const raw = html ? stripHtml(html) : (text || '');
      return truncateText(raw);
    })
    .filter(Boolean);

  if (accessToken && allSamples.length < MIN_SAMPLES_FOR_ANALYSIS) {
    try {
      const graphEmails = await graphGetSentEmails(accessToken, contactEmail, 25);
      const extra = graphEmails
        .map((m) => {
          const body = m.body?.content || '';
          const raw = m.body?.contentType === 'html' ? stripHtml(body) : body;
          return truncateText(raw);
        })
        .filter(Boolean);
      allSamples = [...allSamples, ...extra].slice(0, 25);
    } catch {
      // Graph fetch optional
    }
  }

  if (allSamples.length < 1) {
    return null;
  }

  const linguisticProfile = await analyzeTone(allSamples);

  const rawSamples = allSamples.slice(0, 20);

  upsertToneProfile({
    userId,
    contactEmail,
    linguisticProfile: JSON.stringify(linguisticProfile),
    rawSamples: JSON.stringify(rawSamples),
    sampleCount: allSamples.length,
  });

  return {
    contactEmail,
    sampleCount: allSamples.length,
    linguisticProfile,
    lastAnalyzedAt: Math.floor(Date.now() / 1000),
  };
}

export function shouldReanalyze(profile: Record<string, unknown>): boolean {
  const lastCount = profile.sample_count as number;
  const currentCount = lastCount;
  return currentCount - lastCount >= REANALYSIS_THRESHOLD;
}
