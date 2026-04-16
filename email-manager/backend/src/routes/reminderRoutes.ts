import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../db/database';

const router = Router();

router.get('/', (req: AuthenticatedRequest, res) => {
  const reminders = getDb()
    .prepare(`SELECT * FROM follow_up_reminders WHERE user_id = ? ORDER BY remind_at ASC`)
    .all(req.userId!);
  res.json(reminders);
});

router.post('/', (req: AuthenticatedRequest, res) => {
  const { emailId, remindAt, note } = req.body;
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO follow_up_reminders (user_id, email_id, remind_at, note)
    VALUES (?, ?, ?, ?)
  `).run(req.userId, emailId, remindAt, note || null);
  const reminder = db.prepare(`SELECT * FROM follow_up_reminders WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(reminder);
});

router.patch('/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const sets: string[] = [];
  const params: unknown[] = [];

  if (req.body.remindAt !== undefined) { sets.push('remind_at = ?'); params.push(req.body.remindAt); }
  if (req.body.isTriggered !== undefined) { sets.push('is_triggered = ?'); params.push(req.body.isTriggered ? 1 : 0); }

  if (sets.length > 0) {
    params.push(req.userId, parseInt(req.params.id));
    db.prepare(`UPDATE follow_up_reminders SET ${sets.join(', ')} WHERE user_id = ? AND id = ?`).run(...params);
  }

  res.json(db.prepare(`SELECT * FROM follow_up_reminders WHERE id = ?`).get(parseInt(req.params.id)));
});

router.delete('/:id', (req: AuthenticatedRequest, res) => {
  getDb().prepare(`DELETE FROM follow_up_reminders WHERE user_id = ? AND id = ?`).run(req.userId, parseInt(req.params.id));
  res.json({ success: true });
});

export default router;
