import crypto from "crypto";
import { getDb } from "@/lib/db";

export type QuestionRecord = {
  id: string;
  task_id: string;
  agent_id?: string | null;
  question: string;
  answer?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export async function listQuestions(taskId?: string) {
  const db = await getDb();
  const rows = taskId
    ? await db.all<QuestionRecord[]>("SELECT * FROM task_questions WHERE task_id = ? ORDER BY created_at DESC", taskId)
    : await db.all<QuestionRecord[]>("SELECT * FROM task_questions ORDER BY created_at DESC");
  return rows;
}

export async function createQuestion(data: { task_id: string; agent_id?: string; question: string }) {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO task_questions (id, task_id, agent_id, question, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)` ,
    [id, data.task_id, data.agent_id || null, data.question, "open", now, now]
  );
  const row = await db.get<QuestionRecord>("SELECT * FROM task_questions WHERE id = ?", id);
  return row;
}

export async function answerQuestion(id: string, answer?: string, status: string = "answered") {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.run(
    `UPDATE task_questions SET answer = ?, status = ?, updated_at = ? WHERE id = ?`,
    [answer || null, status, now, id]
  );
  return db.get<QuestionRecord>("SELECT * FROM task_questions WHERE id = ?", id);
}
