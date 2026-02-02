import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const dbPath = path.join(process.cwd(), "data", "tasks.db");

async function ensureDir() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export async function getQuestionsDb(): Promise<Database> {
  await ensureDir();
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS task_questions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      agent_id TEXT,
      question TEXT NOT NULL,
      answer TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT,
      updated_at TEXT
    );
  `);
  return db;
}
