import crypto from "crypto";
import { getDb } from "@/lib/db";

export type TaskEventType =
  | "status_change"
  | "qa_approval"
  | "question"
  | "answer"
  | "token_update"
  | "deploy"
  | "comment";

export type TaskEvent = {
  id: string;
  task_id: string;
  type: TaskEventType;
  actor?: string | null;
  detail?: Record<string, unknown> | null;
  created_at?: string;
};

export async function ensureTaskEventsTable() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS task_events (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      type TEXT NOT NULL,
      actor TEXT,
      detail TEXT,
      created_at TEXT
    );
  `);
}

export async function createTaskEvent(data: { task_id: string; type: TaskEventType; actor?: string; detail?: Record<string, unknown>; }) {
  const db = await getDb();
  await ensureTaskEventsTable();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO task_events (id, task_id, type, actor, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?)` ,
    [id, data.task_id, data.type, data.actor || null, data.detail ? JSON.stringify(data.detail) : null, now]
  );
  return db.get<TaskEvent>("SELECT * FROM task_events WHERE id = ?", id);
}

export async function listTaskEvents(taskId: string) {
  const db = await getDb();
  await ensureTaskEventsTable();
  const rows = await db.all<TaskEvent[]>("SELECT * FROM task_events WHERE task_id = ? ORDER BY datetime(created_at) DESC", taskId);
  return rows.map((r) => ({ ...r, detail: r.detail ? JSON.parse(String(r.detail)) : undefined }));
}
