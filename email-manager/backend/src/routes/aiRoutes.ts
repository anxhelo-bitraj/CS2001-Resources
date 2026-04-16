import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { getEmailById, getUncategorizedEmails, updateEmailAI } from '../db/queries/emailQueries';
import { getToneProfile } from '../db/queries/toneQueries';
import { getTemplates } from '../db/queries/templateQueries';
import { createTask } from '../db/queries/taskQueries';
import { getDb } from '../db/database';
import {
  summarizeEmail, extractActionItems, draftReply,
  categorizeEmails, scoreGuestReviewReply, suggestTemplate,
  detectMeetingRequest,
} from '../services/aiService';
import { getToneProfileForContact, analyzeToneForContact } from '../services/toneService';

const router = Router();
router.use(aiRateLimiter);

router.post('/categorize', async (req: AuthenticatedRequest, res, next) => {
  try {
    const emails = getUncategorizedEmails(req.userId!, 30) as Array<Record<string, unknown>>;
    if (emails.length === 0) { res.json({ categorized: 0 }); return; }

    const results = await categorizeEmails(emails.map((e) => ({
      id: e.id as string,
      subject: e.subject as string,
      fromEmail: e.from_email as string,
      fromName: e.from_name as string || '',
      bodyPreview: e.body_preview as string,
    })));

    for (const r of results) {
      updateEmailAI(r.id, {
        aiCategory: r.category,
        aiSentiment: r.sentiment,
        aiPriorityScore: r.priorityScore,
        hasMeetingRequest: r.hasMeetingRequest ? 1 : 0,
      });
    }

    res.json({ categorized: results.length });
  } catch (err) {
    next(err);
  }
});

router.post('/summarize/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const email = getEmailById(req.userId!, req.params.id) as Record<string, unknown> | undefined;
    if (!email) { res.status(404).json({ error: 'Email not found' }); return; }

    const body = (email.body_text || email.body_preview || '') as string;
    const result = await summarizeEmail(email.subject as string, body);

    updateEmailAI(req.params.id, { aiSummary: result.summary });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/extract-tasks/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const email = getEmailById(req.userId!, req.params.id) as Record<string, unknown> | undefined;
    if (!email) { res.status(404).json({ error: 'Email not found' }); return; }

    const body = (email.body_text || email.body_preview || '') as string;
    const tasks = await extractActionItems(email.subject as string, body);

    updateEmailAI(req.params.id, { actionItems: JSON.stringify(tasks) });

    for (const t of tasks) {
      createTask({
        userId: req.userId!,
        emailId: req.params.id,
        description: t.task,
        dueDate: t.dueDate ? Math.floor(new Date(t.dueDate).getTime() / 1000) : undefined,
        priority: 'medium',
        source: 'ai_extracted',
      });
    }

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.post('/draft-reply/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const email = getEmailById(req.userId!, req.params.id) as Record<string, unknown> | undefined;
    if (!email) { res.status(404).json({ error: 'Email not found' }); return; }

    const contactEmail = email.from_email as string;
    const toneData = await getToneProfileForContact(req.userId!, contactEmail, req.accessToken);
    const toneProfile = toneData?.linguisticProfile || null;

    const body = (email.body_text || email.body_preview || '') as string;
    const isGuest = email.ai_category === 'guest';

    const result = await draftReply(
      { subject: email.subject as string, from: contactEmail, body },
      toneProfile,
      req.body.userNotes || '',
      isGuest
    );

    if (isGuest) {
      const db = getDb();
      db.prepare(`
        INSERT INTO review_response_scores (user_id, email_id, draft_text)
        VALUES (?, ?, ?)
      `).run(req.userId, req.params.id, result.draft);
    }

    res.json({ ...result, profileUsed: toneData });
  } catch (err) {
    next(err);
  }
});

router.get('/tone-profile/:contactEmail', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { contactEmail } = req.params;
    const profile = getToneProfile(req.userId!, decodeURIComponent(contactEmail));
    if (!profile) { res.json(null); return; }

    const p = profile as Record<string, unknown>;
    res.json({
      ...p,
      linguisticProfile: JSON.parse(p.linguistic_profile as string),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/analyze-tone', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { contactEmail } = req.body;
    const result = await analyzeToneForContact(req.userId!, contactEmail, req.accessToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/score-review-reply', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { emailId, draft } = req.body;
    const email = getEmailById(req.userId!, emailId) as Record<string, unknown> | undefined;
    if (!email) { res.status(404).json({ error: 'Email not found' }); return; }

    const original = (email.body_text || email.body_preview || '') as string;
    const result = await scoreGuestReviewReply(original, draft);

    getDb().prepare(`
      UPDATE review_response_scores SET score = ?, score_notes = ?
      WHERE user_id = ? AND email_id = ? AND final_sent = 0
    `).run(result.score, result.notes, req.userId, emailId);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/suggest-template/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const email = getEmailById(req.userId!, req.params.id) as Record<string, unknown> | undefined;
    if (!email) { res.status(404).json({ error: 'Email not found' }); return; }

    const templates = getTemplates(req.userId!) as Array<{ id: number; name: string; category: string | null; bodyTemplate: string }>;

    const suggestion = await suggestTemplate(
      {
        subject: email.subject as string,
        fromEmail: email.from_email as string,
        bodyPreview: email.body_preview as string,
      },
      templates.map((t) => ({ ...t, bodyTemplate: (t as unknown as Record<string, string>).body_template }))
    );

    res.json(suggestion);
  } catch (err) {
    next(err);
  }
});

router.get('/detect-meeting/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const email = getEmailById(req.userId!, req.params.id) as Record<string, unknown> | undefined;
    if (!email) { res.status(404).json({ error: 'Email not found' }); return; }

    const body = (email.body_text || email.body_preview || '') as string;
    const result = await detectMeetingRequest(email.subject as string, body);

    updateEmailAI(req.params.id, { hasMeetingRequest: result.hasMeetingRequest ? 1 : 0 });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
