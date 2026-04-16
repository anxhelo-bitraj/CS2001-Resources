import cron from 'node-cron';
import { getDb } from '../db/database';
import { categorizeEmails } from '../services/aiService';
import { getUncategorizedEmails, updateEmailAI } from '../db/queries/emailQueries';

export function startEmailSyncJob() {
  const schedule = process.env.EMAIL_SYNC_CRON || '*/5 * * * *';

  cron.schedule(schedule, async () => {
    console.log('[Sync] Running background email categorization...');
    try {
      const db = getDb();
      const users = db.prepare(`SELECT id FROM users`).all() as Array<{ id: string }>;

      for (const user of users) {
        const uncategorized = getUncategorizedEmails(user.id, 20) as Array<Record<string, unknown>>;
        if (uncategorized.length === 0) continue;

        const results = await categorizeEmails(uncategorized.map((e) => ({
          id: e.id as string,
          subject: e.subject as string,
          fromEmail: e.from_email as string || '',
          fromName: e.from_name as string || '',
          bodyPreview: e.body_preview as string || '',
        })));

        for (const r of results) {
          updateEmailAI(r.id, {
            aiCategory: r.category,
            aiSentiment: r.sentiment,
            aiPriorityScore: r.priorityScore,
            hasMeetingRequest: r.hasMeetingRequest ? 1 : 0,
          });
        }

        console.log(`[Sync] Categorized ${results.length} emails for user ${user.id}`);
      }
    } catch (err) {
      console.error('[Sync] Error in categorization job:', err);
    }
  });

  console.log(`[Sync] Email categorization job scheduled: ${schedule}`);
}
