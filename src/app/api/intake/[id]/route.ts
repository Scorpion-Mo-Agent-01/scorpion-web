import { NextResponse } from "next/server";
import crypto from "crypto";
import { getWorkflowDb, fetchWorkflowWithGraph } from "@/lib/workflow-db";
import { getTasksDb, createTaskRecord } from "@/lib/tasks-db";

export const runtime = "nodejs";

type Action = "approve" | "reject";

type WorkflowRecord = {
  id: string;
  name: string;
};

type WorkflowNodeRow = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  assignee_role?: string | null;
};

type WorkflowEdgeRow = {
  id: string;
  from_node_id: string;
  to_node_id: string;
};

type WorkflowGraph = {
  workflow: WorkflowRecord;
  nodes: WorkflowNodeRow[];
  edges: WorkflowEdgeRow[];
};

function topoSort(nodes: WorkflowNodeRow[], edges: WorkflowEdgeRow[]) {
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  for (const n of nodes) {
    indegree.set(n.id, 0);
    adjacency.set(n.id, []);
  }
  for (const e of edges) {
    if (!indegree.has(e.to_node_id) || !indegree.has(e.from_node_id)) continue;
    indegree.set(e.to_node_id, (indegree.get(e.to_node_id) || 0) + 1);
    adjacency.get(e.from_node_id)?.push(e.to_node_id);
  }
  const queue = Array.from(indegree.entries()).filter(([, d]) => d === 0).map(([id]) => id);
  const result: string[] = [];
  while (queue.length) {
    const current = queue.shift() as string;
    result.push(current);
    for (const neighbor of adjacency.get(current) || []) {
      indegree.set(neighbor, (indegree.get(neighbor) || 0) - 1);
      if ((indegree.get(neighbor) || 0) === 0) queue.push(neighbor);
    }
  }
  return result;
}

async function processIntake(intake: IntakeRow, graph: WorkflowGraph) {
  const tasksDb = await getTasksDb();
  const wfDb = await getWorkflowDb();
  const order = topoSort(graph.nodes, graph.edges);
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const now = new Date().toISOString();

  for (const nodeId of order) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    if ((node.type || "task") !== "task") continue;
    try {
      const inboxId = await createTaskRecord(tasksDb, {
        title: node.title,
        description: node.description || undefined,
        assignedAgent: node.assignee_role || undefined,
        status: "inbox",
        tags: ["workflow", graph.workflow.name].filter(Boolean),
      });
      await wfDb.run(
        `INSERT INTO generated_tasks (id, intake_request_id, workflow_node_id, title, description, assignee_role, status, inbox_task_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          crypto.randomUUID(),
          intake.id,
          nodeId,
          node.title,
          node.description || null,
          node.assignee_role || null,
          "created",
          inboxId,
          now,
          now
        ]
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      await wfDb.run(
        `INSERT INTO generated_tasks (id, intake_request_id, workflow_node_id, title, description, assignee_role, status, inbox_task_id, error_msg, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          crypto.randomUUID(),
          intake.id,
          nodeId,
          node.title,
          node.description || null,
          node.assignee_role || null,
          "failed",
          null,
          message,
          now,
          now
        ]
      );
    }
  }
}

type IntakeRow = {
  id: string;
  workflow_id: string;
  status: string;
};

type GeneratedTaskRow = {
  id: string;
  status: string;
  inbox_task_id?: string | null;
  error_msg?: string | null;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getWorkflowDb();
    const intake = await db.get<IntakeRow>("SELECT * FROM intake_requests WHERE id = ?", id);
    if (!intake) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const generated = await db.all<GeneratedTaskRow[]>("SELECT * FROM generated_tasks WHERE intake_request_id = ?", id);
    return NextResponse.json({ intake, generated });
  } catch (error) {
    console.error("Failed to fetch intake", error);
    return NextResponse.json({ error: "Failed to fetch intake" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action } = await request.json();
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const db = await getWorkflowDb();
    const intake = await db.get<IntakeRow>("SELECT * FROM intake_requests WHERE id = ?", id);
    if (!intake) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (intake.status !== "submitted") {
      return NextResponse.json({ error: "Intake already processed" }, { status: 400 });
    }
    const now = new Date().toISOString();

    if ((action as Action) === "reject") {
      await db.run("UPDATE intake_requests SET status = ?, updated_at = ?, processed_at = ? WHERE id = ?", ["rejected", now, now, id]);
      return NextResponse.json({ status: "rejected" });
    }

    // Approve path
    const graph = (await fetchWorkflowWithGraph(db, intake.workflow_id)) as WorkflowGraph | null;
    if (!graph) return NextResponse.json({ error: "Workflow missing" }, { status: 404 });
    await processIntake(intake, graph);
    await db.run("UPDATE intake_requests SET status = ?, updated_at = ?, processed_at = ? WHERE id = ?", ["approved", now, now, id]);

    const generated = await db.all("SELECT * FROM generated_tasks WHERE intake_request_id = ?", id);
    return NextResponse.json({ status: "approved", generated });
  } catch (error) {
    console.error("Failed to process intake", error);
    return NextResponse.json({ error: "Failed to process intake" }, { status: 500 });
  }
}
