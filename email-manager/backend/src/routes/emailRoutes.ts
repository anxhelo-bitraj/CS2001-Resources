import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getEmails, getEmailById, getEmailsByConversation,
  markEmailRead, setEmailCategory, deleteEmail, snoozeEmail,
} from '../db/queries/emailQueries';
import {
  getMessage, sendMail, replyToMessage, forwardMessage,
  markMessageRead, deleteMessage,
} from '../services/graphService';
import { syncAll } from '../services/syncService';

const router = Router();

router.get('/counts', (req: AuthenticatedRequest, res) => {
  const { getEmailCountByCategory } = require('../db/queries/emailQueries');
  res.json(getEmailCountByCategory(req.userId!));
});

router.get('/', (req: AuthenticatedRequest, res) => {
  const { folder = 'inbox', category, search, page = '1', limit = '50' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const emails = getEmails(req.userId!, { folder, category, search, limit: parseInt(limit), offset });
  res.json({ emails, page: parseInt(page) });
});

router.get('/sync', async (req: AuthenticatedRequest, res, next) => {
  try {
    const synced = await syncAll(req.accessToken!, req.userId!);
    res.json({ synced });
  } catch (err) {
    next(err);
  }
});

router.post('/sync', async (req: AuthenticatedRequest, res, next) => {
  try {
    const synced = await syncAll(req.accessToken!, req.userId!);
    res.json({ synced });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    let email = getEmailById(req.userId!, req.params.id) as Record<string, unknown> | undefined;

    if (!email?.body_html) {
      const graphMsg = await getMessage(req.accessToken!, req.params.id);
      if (graphMsg.body) {
        email = {
          ...email,
          body_html: graphMsg.body.contentType === 'html' ? graphMsg.body.content : null,
          body_text: graphMsg.body.contentType === 'text' ? graphMsg.body.content : null,
        };
      }
    }

    if (!email) { res.status(404).json({ error: 'Email not found' }); return; }
    res.json(email);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/thread', (req: AuthenticatedRequest, res) => {
  const email = getEmailById(req.userId!, req.params.id) as Record<string, unknown> | undefined;
  if (!email?.conversation_id) { res.json([]); return; }
  res.json(getEmailsByConversation(req.userId!, email.conversation_id as string));
});

router.post('/send', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { to, subject, body } = req.body;
    await sendMail(req.accessToken!, { to, subject, body, isHtml: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reply', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { body } = req.body;
    await replyToMessage(req.accessToken!, req.params.id, body);

    const email = getEmailById(req.userId!, req.params.id) as Record<string, unknown> | undefined;
    if (email) {
      const db = (await import('../db/database')).getDb();
      db.prepare(`
        INSERT INTO response_time_log (user_id, email_id, contact_email, category, received_at, replied_at, response_time_minutes)
        VALUES (?, ?, ?, ?, ?, unixepoch(), ?)
      `).run(
        req.userId,
        req.params.id,
        email.from_email,
        email.ai_category,
        email.received_at,
        email.received_at
          ? Math.round((Date.now() / 1000 - (email.received_at as number)) / 60)
          : null
      );
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/forward', async (req: AuthenticatedRequest, res, next) => {
  try {
    await forwardMessage(req.accessToken!, req.params.id, req.body.to, req.body.comment);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req: AuthenticatedRequest, res, next) => {
  try {
    const isRead = req.body.isRead ?? true;
    markEmailRead(req.userId!, req.params.id, isRead);
    await markMessageRead(req.accessToken!, req.params.id, isRead);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/category', (req: AuthenticatedRequest, res) => {
  setEmailCategory(req.userId!, req.params.id, req.body.category);
  res.json({ success: true });
});

router.post('/:id/snooze', (req: AuthenticatedRequest, res) => {
  snoozeEmail(req.userId!, req.params.id, req.body.until);
  res.json({ success: true });
});

router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    deleteEmail(req.userId!, req.params.id);
    await deleteMessage(req.accessToken!, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
