import { NextResponse } from "next/server";
import { getWorkflowDb, replaceWorkflowGraph, fetchWorkflowWithGraph, WorkflowEdgeInput, WorkflowNodeInput } from "@/lib/workflow-db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getWorkflowDb();
    const result = await fetchWorkflowWithGraph(db, id);
    if (!result) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch workflow", error);
    return NextResponse.json({ error: "Failed to fetch workflow" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, description, is_active, nodes = [], edges = [] } = await request.json();
    const db = await getWorkflowDb();
    const existing = await db.get("SELECT * FROM workflows WHERE id = ?", id);
    if (!existing) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    const now = new Date().toISOString();
    await db.run(
      `UPDATE workflows SET name = ?, description = ?, is_active = ?, updated_at = ? WHERE id = ?`,
      [name ?? existing.name, description ?? existing.description, is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active, now, id]
    );

    if (nodes.length || edges.length) {
      await replaceWorkflowGraph(db, id, nodes as WorkflowNodeInput[], edges as WorkflowEdgeInput[]);
    }

    const result = await fetchWorkflowWithGraph(db, id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update workflow", error);
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}
