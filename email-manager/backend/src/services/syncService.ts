import { listMessages, GraphMessage } from './graphService';
import { upsertEmail } from '../db/queries/emailQueries';
import { upsertContact } from '../db/queries/contactQueries';
import { getDb } from '../db/database';

const deltaLinks: Map<string, string> = new Map();

function graphMessageToRow(msg: GraphMessage, userId: string, folder: string) {
  return {
    id: msg.id,
    user_id: userId,
    internet_message_id: msg.internetMessageId || null,
    conversation_id: msg.conversationId || null,
    from_email: msg.from?.emailAddress?.address?.toLowerCase() || null,
    from_name: msg.from?.emailAddress?.name || null,
    to_emails: JSON.stringify((msg.toRecipients || []).map((r) => ({
      email: r.emailAddress.address.toLowerCase(),
      name: r.emailAddress.name || '',
    }))),
    subject: msg.subject || '(no subject)',
    body_preview: msg.bodyPreview || '',
    body_html: msg.body?.contentType === 'html' ? msg.body.content : null,
    body_text: msg.body?.contentType === 'text' ? msg.body.content : null,
    folder,
    is_read: msg.isRead ? 1 : 0,
    has_attachments: msg.hasAttachments ? 1 : 0,
    received_at: msg.receivedDateTime
      ? Math.floor(new Date(msg.receivedDateTime).getTime() / 1000)
      : null,
    sent_at: msg.sentDateTime
      ? Math.floor(new Date(msg.sentDateTime).getTime() / 1000)
      : null,
    importance: msg.importance || 'normal',
    categories: JSON.stringify(msg.categories || []),
  };
}

export async function syncFolder(
  accessToken: string,
  userId: string,
  folder: 'inbox' | 'sent',
  top = 50
): Promise<number> {
  const key = `${userId}:${folder}`;
  const existing = deltaLinks.get(key);

  const { messages, deltaLink } = await listMessages(accessToken, folder, existing, top);

  if (deltaLink) deltaLinks.set(key, deltaLink);

  let synced = 0;
  for (const msg of messages) {
    const row = graphMessageToRow(msg, userId, folder);
    upsertEmail(row);

    if (msg.from?.emailAddress?.address) {
      upsertContact({
        id: msg.from.emailAddress.address.toLowerCase(),
        userId,
        displayName: msg.from.emailAddress.name,
      });
    }
    synced++;
  }

  return synced;
}

export async function syncAll(accessToken: string, userId: string): Promise<number> {
  const [inboxCount, sentCount] = await Promise.all([
    syncFolder(accessToken, userId, 'inbox'),
    syncFolder(accessToken, userId, 'sent', 25),
  ]);
  return inboxCount + sentCount;
}

export function upsertUser(userId: string, email: string, displayName: string, settings?: string) {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (id, email, display_name, settings)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      display_name = excluded.display_name
  `).run(userId, email, displayName, settings || null);
}
