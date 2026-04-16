import { getDb } from '../db/database';
import { generateMorningBriefing } from './aiService';
import { getCalendarEvents } from './graphService';
import { format } from 'date-fns';

export async function generateDailyBriefing(
  userId: string,
  accessToken: string,
  dateStr?: string
): Promise<{ content: string; emailCount: number; taskCount: number }> {
  const db = getDb();
  const date = dateStr || format(new Date(), 'yyyy-MM-dd');

  const yesterday = Math.floor(Date.now() / 1000) - 86400;

  const urgentEmails = db.prepare(`
    SELECT subject, from_name as "from", body_preview as preview
    FROM email_cache
    WHERE user_id = ? AND folder = 'inbox' AND is_read = 0
      AND (ai_priority_score >= 70 OR ai_sentiment = 'urgent')
    ORDER BY ai_priority_score DESC LIMIT 10
  `).all(userId) as Array<{ subject: string; from: string; preview: string }>;

  const pendingTasks = db.prepare(`
    SELECT description, priority, due_date as dueDate
    FROM tasks
    WHERE user_id = ? AND is_done = 0
    ORDER BY priority = 'high' DESC, due_date ASC NULLS LAST
    LIMIT 10
  `).all(userId) as Array<{ description: string; priority: string; dueDate?: number }>;

  const overdueReminders = db.prepare(`
    SELECT COUNT(*) as count FROM follow_up_reminders
    WHERE user_id = ? AND is_triggered = 0 AND remind_at < ?
  `).get(userId, Math.floor(Date.now() / 1000)) as { count: number };

  const emailStats = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
    FROM email_cache WHERE user_id = ? AND folder = 'inbox'
  `).get(userId) as { total: number; unread: number };

  const categoryCounts = db.prepare(`
    SELECT ai_category as category, COUNT(*) as count
    FROM email_cache WHERE user_id = ? AND folder = 'inbox' AND is_read = 0
    GROUP BY ai_category
  `).all(userId) as Array<{ category: string; count: number }>;

  const byCategory: Record<string, number> = {};
  for (const row of categoryCounts) {
    byCategory[row.category || 'unknown'] = row.count;
  }

  let calendarEvents: Array<{ subject: string; start: string; end: string }> = [];
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const raw = await getCalendarEvents(accessToken, todayStart.toISOString(), todayEnd.toISOString());
    calendarEvents = raw.map((e) => ({
      subject: e.subject,
      start: e.start.dateTime,
      end: e.end.dateTime,
    }));
  } catch {
    // Calendar optional
  }

  const content = await generateMorningBriefing({
    urgentEmails,
    pendingTasks: pendingTasks.map((t) => ({
      description: t.description,
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate * 1000).toLocaleDateString() : undefined,
    })),
    overdueFollowUps: overdueReminders.count,
    calendarEvents,
    emailStats: { total: emailStats.total || 0, unread: emailStats.unread || 0, byCategory },
    date,
  });

  const taskCount = pendingTasks.length;
  const emailCount = emailStats.unread || 0;

  db.prepare(`
    INSERT INTO daily_briefings (user_id, briefing_date, content, email_count, task_count)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, briefing_date) DO UPDATE SET
      content = excluded.content,
      email_count = excluded.email_count,
      task_count = excluded.task_count
  `).run(userId, date, content, emailCount, taskCount);

  return { content, emailCount, taskCount };
}
