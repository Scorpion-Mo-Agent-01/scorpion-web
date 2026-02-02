import { NextResponse } from "next/server";
import { createQuestion, listQuestions, answerQuestion } from "@/lib/repos/questions-repo";
import { createTaskEvent } from "@/lib/repos/task-events-repo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const taskId = new URL(request.url).searchParams.get("task_id") || undefined;
    const rows = await listQuestions(taskId);
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
    const row = await createQuestion({ task_id, agent_id, question });
    await createTaskEvent({ task_id, type: "question", actor: agent_id, detail: { question } });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Failed to create question", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, answer, status, task_id, actor } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const row = await answerQuestion(id, answer, status || "answered");
    if (task_id) {
      await createTaskEvent({ task_id, type: "answer", actor: actor || "system", detail: { answer, status: status || "answered" } });
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error("Failed to update question", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}
