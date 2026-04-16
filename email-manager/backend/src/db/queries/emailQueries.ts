import { getDb } from '../database';

export function upsertEmail(email: Record<string, unknown>) {
  const db = getDb();
  db.prepare(`
    INSERT INTO email_cache (
      id, user_id, internet_message_id, conversation_id,
      from_email, from_name, to_emails, subject, body_preview,
      body_html, body_text, folder, is_read, has_attachments,
      received_at, sent_at, importance, categories, synced_at
    ) VALUES (
      @id, @user_id, @internet_message_id, @conversation_id,
      @from_email, @from_name, @to_emails, @subject, @body_preview,
      @body_html, @body_text, @folder, @is_read, @has_attachments,
      @received_at, @sent_at, @importance, @categories, unixepoch()
    )
    ON CONFLICT(id) DO UPDATE SET
      is_read = excluded.is_read,
      body_html = COALESCE(excluded.body_html, email_cache.body_html),
      body_text = COALESCE(excluded.body_text, email_cache.body_text),
      synced_at = unixepoch()
  `).run(email);
}

export function getEmails(userId: string, opts: {
  folder?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = getDb();
  const { folder = 'inbox', category, search, limit = 50, offset = 0 } = opts;

  let query = `SELECT * FROM email_cache WHERE user_id = ?`;
  const params: unknown[] = [userId];

  if (folder !== 'all') {
    query += ` AND folder = ?`;
    params.push(folder);
  }
  if (category) {
    query += ` AND ai_category = ?`;
    params.push(category);
  }
  if (search) {
    query += ` AND (subject LIKE ? OR from_email LIKE ? OR from_name LIKE ? OR body_preview LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ` AND (snoozed_until IS NULL OR snoozed_until < unixepoch())`;
  query += ` ORDER BY received_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

export function getEmailById(userId: string, id: string) {
  return getDb().prepare(`SELECT * FROM email_cache WHERE id = ? AND user_id = ?`).get(id, userId);
}

export function getEmailsByConversation(userId: string, conversationId: string) {
  return getDb()
    .prepare(`SELECT * FROM email_cache WHERE user_id = ? AND conversation_id = ? ORDER BY received_at ASC`)
    .all(userId, conversationId);
}

export function getSentEmailsToContact(userId: string, contactEmail: string, limit = 25) {
  return getDb()
    .prepare(`
      SELECT * FROM email_cache
      WHERE user_id = ? AND folder = 'sent' AND to_emails LIKE ?
      ORDER BY sent_at DESC LIMIT ?
    `)
    .all(userId, `%${contactEmail}%`, limit);
}

export function updateEmailAI(id: string, data: {
  aiCategory?: string;
  aiSummary?: string;
  aiSentiment?: string;
  aiPriorityScore?: number;
  actionItems?: string;
  hasMeetingRequest?: number;
}) {
  const db = getDb();
  const sets: string[] = [];
  const params: unknown[] = [];

  if (data.aiCategory !== undefined) { sets.push('ai_category = ?'); params.push(data.aiCategory); }
  if (data.aiSummary !== undefined) { sets.push('ai_summary = ?'); params.push(data.aiSummary); }
  if (data.aiSentiment !== undefined) { sets.push('ai_sentiment = ?'); params.push(data.aiSentiment); }
  if (data.aiPriorityScore !== undefined) { sets.push('ai_priority_score = ?'); params.push(data.aiPriorityScore); }
  if (data.actionItems !== undefined) { sets.push('action_items = ?'); params.push(data.actionItems); }
  if (data.hasMeetingRequest !== undefined) { sets.push('has_meeting_request = ?'); params.push(data.hasMeetingRequest); }

  if (sets.length === 0) return;
  params.push(id);
  db.prepare(`UPDATE email_cache SET ${sets.join(', ')} WHERE id = ?`).run(...params);
}

export function markEmailRead(userId: string, id: string, isRead: boolean) {
  getDb().prepare(`UPDATE email_cache SET is_read = ? WHERE id = ? AND user_id = ?`)
    .run(isRead ? 1 : 0, id, userId);
}

export function setEmailCategory(userId: string, id: string, category: string) {
  getDb().prepare(`UPDATE email_cache SET ai_category = ? WHERE id = ? AND user_id = ?`)
    .run(category, id, userId);
}

export function snoozeEmail(userId: string, id: string, until: number) {
  getDb().prepare(`UPDATE email_cache SET snoozed_until = ? WHERE id = ? AND user_id = ?`)
    .run(until, id, userId);
}

export function deleteEmail(userId: string, id: string) {
  getDb().prepare(`DELETE FROM email_cache WHERE id = ? AND user_id = ?`).run(id, userId);
}

export function getEmailCountByCategory(userId: string) {
  return getDb()
    .prepare(`
      SELECT ai_category as category, COUNT(*) as count,
             SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
      FROM email_cache
      WHERE user_id = ? AND folder = 'inbox'
        AND (snoozed_until IS NULL OR snoozed_until < unixepoch())
      GROUP BY ai_category
    `)
    .all(userId);
}

export function getUncategorizedEmails(userId: string, limit = 50) {
  return getDb()
    .prepare(`
      SELECT id, subject, body_preview, from_email, from_name
      FROM email_cache WHERE user_id = ? AND ai_category IS NULL LIMIT ?
    `)
    .all(userId, limit);
}
