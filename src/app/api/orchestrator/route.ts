import { NextResponse } from "next/server";
import { runMaestroTask } from "@/lib/orchestrator/maestro";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workflowId, nodeId, instruction, contextSummary, provider, model } = body;
    if (!workflowId || !nodeId || !instruction) {
      return NextResponse.json({ error: "workflowId, nodeId, and instruction are required" }, { status: 400 });
    }
    const result = await runMaestroTask({ workflowId, nodeId, instruction, contextSummary, provider, model });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Maestro run failed", err);
    return NextResponse.json({ error: (err as Error).message || "Maestro error" }, { status: 500 });
  }
}
