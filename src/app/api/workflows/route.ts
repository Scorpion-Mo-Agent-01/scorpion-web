import { NextResponse } from "next/server";
import crypto from "crypto";
import { getWorkflowDb, replaceWorkflowGraph, WorkflowEdgeInput, WorkflowNodeInput } from "@/lib/workflow-db";

export const runtime = "nodejs";

type WorkflowRow = {
  id: string;
  name: string;
  description?: string | null;
  is_active?: number;
};

export async function GET() {
  try {
    const db = await getWorkflowDb();
    const workflows = await db.all<WorkflowRow[]>("SELECT * FROM workflows ORDER BY created_at DESC");
    const results: Array<WorkflowRow & { nodes: unknown[]; edges: unknown[] }> = [];
    for (const wf of workflows) {
      const nodes = await db.all("SELECT * FROM workflow_nodes WHERE workflow_id = ?", wf.id);
      const edges = await db.all("SELECT * FROM workflow_edges WHERE workflow_id = ?", wf.id);
      results.push({ ...wf, nodes, edges });
    }
    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch workflows", error);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, createdBy, nodes = [], edges = [] } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const db = await getWorkflowDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO workflows (id, name, description, is_active, created_by, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)` ,
      [id, name.trim(), description || null, 0, createdBy || null, 1, now, now]
    );

    if (nodes.length || edges.length) {
      await replaceWorkflowGraph(db, id, nodes as WorkflowNodeInput[], edges as WorkflowEdgeInput[]);
    }

    const workflow = await db.get("SELECT * FROM workflows WHERE id = ?", id);
    const savedNodes = await db.all("SELECT * FROM workflow_nodes WHERE workflow_id = ?", id);
    const savedEdges = await db.all("SELECT * FROM workflow_edges WHERE workflow_id = ?", id);

    return NextResponse.json({ ...workflow, nodes: savedNodes, edges: savedEdges }, { status: 201 });
  } catch (error) {
    console.error("Failed to create workflow", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
