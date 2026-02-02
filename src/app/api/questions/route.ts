import { NextResponse } from "next/server";
import crypto from "crypto";
import { getQuestionsDb } from "@/lib/questions-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const db = await getQuestionsDb();
    const taskId = new URL(request.url).searchParams.get("task_id");
    const rows = taskId
      ? await db.all("SELECT * FROM task_questions WHERE task_id = ? ORDER BY created_at DESC", taskId)
      : await db.all("SELECT * FROM task_questions ORDER BY created_at DESC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch questions", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { task_id, agent_id, question } = await request.json();
    if (!task_id || !question) {
      return NextResponse.json({ error: "task_id and question are required" }, { status: 400 });
    }
    const db = await getQuestionsDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO task_questions (id, task_id, agent_id, question, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [id, task_id, agent_id || null, question, "open", now, now]
    );
    const row = await db.get("SELECT * FROM task_questions WHERE id = ?", id);
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Failed to create question", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, answer, status } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const db = await getQuestionsDb();
    const now = new Date().toISOString();
    await db.run(
      `UPDATE task_questions SET answer = ?, status = ?, updated_at = ? WHERE id = ?` ,
      [answer || null, status || "answered", now, id]
    );
    const row = await db.get("SELECT * FROM task_questions WHERE id = ?", id);
    return NextResponse.json(row);
  } catch (error) {
    console.error("Failed to update question", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}
