import { getDb } from '../database';

export function upsertContact(data: {
  id: string;
  userId: string;
  displayName?: string;
  category?: string;
}) {
  getDb().prepare(`
    INSERT INTO contacts (id, user_id, display_name, category)
    VALUES (@id, @userId, @displayName, @category)
    ON CONFLICT(id) DO UPDATE SET
      display_name = COALESCE(excluded.display_name, contacts.display_name),
      updated_at = unixepoch()
  `).run(data);
}

export function getContacts(userId: string) {
  return getDb().prepare(`SELECT * FROM contacts WHERE user_id = ?`).all(userId);
}

export function getContactByEmail(userId: string, email: string) {
  return getDb().prepare(`SELECT * FROM contacts WHERE user_id = ? AND id = ?`).get(userId, email.toLowerCase());
}

export function updateContact(userId: string, email: string, data: Record<string, unknown>) {
  const db = getDb();
  const allowed = ['category', 'is_vip', 'vip_rules', 'response_sla_hours', 'notes', 'display_name'];
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, val] of Object.entries(data)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowed.includes(col)) {
      sets.push(`${col} = ?`);
      params.push(typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }

  if (sets.length === 0) return;
  sets.push('updated_at = unixepoch()');
  params.push(userId, email.toLowerCase());
  db.prepare(`UPDATE contacts SET ${sets.join(', ')} WHERE user_id = ? AND id = ?`).run(...params);
}

export function deleteContact(userId: string, email: string) {
  getDb().prepare(`DELETE FROM contacts WHERE user_id = ? AND id = ?`).run(userId, email.toLowerCase());
}
