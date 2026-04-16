import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { migrate001 } from './migrations/001_initial_schema';

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/emailmanager.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance: BetterSqlite3.Database | null = null;

export function getDb(): BetterSqlite3.Database {
  if (!dbInstance) {
    dbInstance = new BetterSqlite3(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('synchronous = NORMAL');
  }
  return dbInstance;
}

export function runMigrations() {
  const db = getDb();
  let applied: string[] = [];
  try {
    applied = db
      .prepare(`SELECT version FROM schema_migrations`)
      .all()
      .map((r) => (r as Record<string, unknown>).version as string);
  } catch {
    applied = [];
  }

  if (!applied.includes('001')) {
    migrate001(db);
    console.log('[DB] Migration 001 applied');
  }
}

export default getDb;
