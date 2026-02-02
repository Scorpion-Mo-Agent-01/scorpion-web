import { NextResponse } from "next/server";
import { getWorkflowDb } from "@/lib/workflow-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { workflow_id, payload, submitted_by } = await request.json();
    if (!workflow_id) {
      return NextResponse.json({ error: "workflow_id is required" }, { status: 400 });
    }
    const db = await getWorkflowDb();
    const workflow = await db.get("SELECT * FROM workflows WHERE id = ?", workflow_id);
    if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    if (!workflow.is_active) return NextResponse.json({ error: "Workflow is not active" }, { status: 400 });

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO intake_requests (id, workflow_id, submitted_by, payload, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [id, workflow_id, submitted_by || null, payload ? JSON.stringify(payload) : "{}", "submitted", now, now]
    );

    return NextResponse.json({ id, status: "submitted" }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit intake", error);
    return NextResponse.json({ error: "Failed to submit intake" }, { status: 500 });
  }
}
