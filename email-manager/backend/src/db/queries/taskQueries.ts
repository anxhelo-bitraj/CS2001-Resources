import { getDb } from '../database';

export function getTasks(userId: string, opts: { done?: boolean; priority?: string } = {}) {
  let query = `SELECT * FROM tasks WHERE user_id = ?`;
  const params: unknown[] = [userId];

  if (opts.done !== undefined) {
    query += ` AND is_done = ?`;
    params.push(opts.done ? 1 : 0);
  }
  if (opts.priority) {
    query += ` AND priority = ?`;
    params.push(opts.priority);
  }

  query += ` ORDER BY is_done ASC, priority = 'high' DESC, due_date ASC NULLS LAST, created_at DESC`;
  return getDb().prepare(query).all(...params);
}

export function createTask(data: {
  userId: string;
  emailId?: string;
  description: string;
  dueDate?: number;
  priority: string;
  source: string;
}) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO tasks (user_id, email_id, description, due_date, priority, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.userId, data.emailId || null, data.description, data.dueDate || null, data.priority, data.source);
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(result.lastInsertRowid);
}

export function updateTask(userId: string, id: number, data: Record<string, unknown>) {
  const db = getDb();
  const allowed = { isDone: 'is_done', dueDate: 'due_date', priority: 'priority', description: 'description' };
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [jsKey, col] of Object.entries(allowed)) {
    if (jsKey in data) {
      sets.push(`${col} = ?`);
      params.push(data[jsKey]);
    }
  }

  if (sets.length === 0) return;
  params.push(userId, id);
  db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE user_id = ? AND id = ?`).run(...params);
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
}

export function deleteTask(userId: string, id: number) {
  getDb().prepare(`DELETE FROM tasks WHERE user_id = ? AND id = ?`).run(userId, id);
}
