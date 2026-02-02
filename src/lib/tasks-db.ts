import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const tasksDbPath = path.join(process.cwd(), "data", "tasks.db");

async function ensureDir() {
  fs.mkdirSync(path.dirname(tasksDbPath), { recursive: true });
}

export async function getTasksDb(): Promise<Database> {
  await ensureDir();
  const db = await open({ filename: tasksDbPath, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      assigned_agent TEXT,
      tags TEXT,
      security_flagged INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );
  `);
  return db;
}

export async function createTaskRecord(db: Database, data: { title: string; description?: string; assignedAgent?: string; status?: string; tags?: string[]; }): Promise<string> {
  const id = Math.random().toString(36).substr(2, 9);
  const createdAt = new Date().toISOString();
  const status = data.status || (data.assignedAgent ? "assigned" : "inbox");
  await db.run(
    `INSERT INTO tasks (id, title, description, status, assigned_agent, tags, security_flagged, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.description || null,
      status,
      data.assignedAgent || null,
      data.tags ? JSON.stringify(data.tags) : JSON.stringify([]),
      0,
      createdAt
    ]
  );
  return id;
}
