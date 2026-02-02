import { NextResponse } from "next/server";
import crypto from "crypto";
import { getWorkflowDb, replaceWorkflowGraph, fetchWorkflowWithGraph, WorkflowEdgeInput, WorkflowNodeInput } from "@/lib/workflow-db";

export const runtime = "nodejs";

type WorkflowRow = {
  id: string;
  name: string;
  description?: string | null;
  is_active?: number;
};

type WorkflowNodeRow = {
  id: string;
  workflow_id: string;
  node_key: string;
  title: string;
  description?: string | null;
  type?: string | null;
  assignee_role?: string | null;
  assignee_agent_id?: string | null;
  status?: string | null;
  model_name?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  skills_used?: string | null;
  time_spent_ms?: number | null;
  context_summary?: string | null;
  telemetry?: string | null;
  order_index?: number | null;
  metadata?: string | null;
  ui_position?: string | null;
};

type WorkflowEdgeRow = {
  id: string;
  from_node_id: string;
  to_node_id: string;
};

const parseNode = (node: WorkflowNodeRow) => ({
  ...node,
  metadata: node.metadata ? JSON.parse(node.metadata) : null,
  ui_position: node.ui_position ? JSON.parse(node.ui_position) : null,
  skills_used: node.skills_used ? JSON.parse(node.skills_used) : [],
  telemetry: node.telemetry ? JSON.parse(node.telemetry) : null,
});

export async function GET() {
  try {
    const db = await getWorkflowDb();
    const workflows = await db.all<WorkflowRow[]>("SELECT * FROM workflows ORDER BY created_at DESC");
    const results: Array<WorkflowRow & { nodes: unknown[]; edges: unknown[] }> = [];
    for (const wf of workflows) {
      const nodes = await db.all<WorkflowNodeRow[]>("SELECT * FROM workflow_nodes WHERE workflow_id = ?", wf.id);
      const edges = await db.all<WorkflowEdgeRow[]>("SELECT * FROM workflow_edges WHERE workflow_id = ?", wf.id);
      results.push({ ...wf, nodes: nodes.map(parseNode), edges });
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

    const result = await fetchWorkflowWithGraph(db, id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create workflow", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
