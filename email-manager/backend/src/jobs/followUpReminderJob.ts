import cron from 'node-cron';
import { getDb } from '../db/database';

export function startFollowUpReminderJob() {
  const schedule = process.env.FOLLOW_UP_CHECK_CRON || '*/15 * * * *';

  cron.schedule(schedule, () => {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    const dueReminders = db.prepare(`
      SELECT r.*, e.subject, e.from_name, e.from_email
      FROM follow_up_reminders r
      LEFT JOIN email_cache e ON e.id = r.email_id
      WHERE r.is_triggered = 0 AND r.remind_at <= ?
    `).all(now) as Array<Record<string, unknown>>;

    if (dueReminders.length === 0) return;

    db.prepare(`
      UPDATE follow_up_reminders SET is_triggered = 1
      WHERE is_triggered = 0 AND remind_at <= ?
    `).run(now);

    console.log(`[Reminders] Triggered ${dueReminders.length} follow-up reminders`);
  });

  console.log(`[Reminders] Follow-up job scheduled: ${schedule}`);
}
