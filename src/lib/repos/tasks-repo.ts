import crypto from "crypto";
import { getDb } from "@/lib/db";

export type TaskRow = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  assigned_agent?: string | null;
  tags?: string | null;
  project?: string | null;
  security_flagged?: number;
  qa_approved?: number;
  input_tokens?: number;
  output_tokens?: number;
  created_at?: string;
  updated_at?: string;
};

export type TaskRecord = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  assignedAgent?: string | null;
  tags: string[];
  project?: string | null;
  securityFlagged: boolean;
  qaApproved: boolean;
  inputTokens: number;
  outputTokens: number;
  createdAt?: string;
  updatedAt?: string;
};

function format(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    status: row.status,
    assignedAgent: row.assigned_agent || undefined,
    tags: row.tags ? JSON.parse(row.tags) : [],
    project: row.project || undefined,
    securityFlagged: Boolean(row.security_flagged),
    qaApproved: Boolean(row.qa_approved),
    inputTokens: Number(row.input_tokens || 0),
    outputTokens: Number(row.output_tokens || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTasks(project?: string, id?: string) {
  const db = await getDb();
  let rows: TaskRow[] = [];
  if (id) {
    rows = await db.all<TaskRow[]>("SELECT * FROM tasks WHERE id = ?", id);
  } else if (project) {
    rows = await db.all<TaskRow[]>("SELECT * FROM tasks WHERE project = ? ORDER BY created_at DESC", project);
  } else {
    rows = await db.all<TaskRow[]>("SELECT * FROM tasks ORDER BY created_at DESC");
  }
  return rows.map(format);
}

export async function createTask(data: { title: string; description?: string; assignedAgent?: string; tags?: string[]; project?: string; status?: string; }) {
  const db = await getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const status = data.status || (data.assignedAgent ? "assigned" : "inbox");
  await db.run(
    `INSERT INTO tasks (id, title, description, status, assigned_agent, tags, project, security_flagged, qa_approved, input_tokens, output_tokens, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      id,
      data.title.trim(),
      data.description?.trim() || null,
      status,
      data.assignedAgent || null,
      data.tags ? JSON.stringify(data.tags) : JSON.stringify([]),
      data.project || "default",
      0,
      0,
      0,
      0,
      createdAt
    ]
  );
  const row = await db.get<TaskRow>("SELECT * FROM tasks WHERE id = ?", id);
  return format(row!);
}

export async function updateTask(data: { id: string; status?: string; assignedAgent?: string; securityFlagged?: boolean; qaApproved?: boolean; inputTokens?: number; outputTokens?: number; project?: string; }) {
  const db = await getDb();
  const existing = await db.get<TaskRow>("SELECT * FROM tasks WHERE id = ?", data.id);
  if (!existing) throw new Error("Task not found");

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.status !== undefined) {
    if (data.status === "done") {
      if (existing.assigned_agent !== "john") {
        throw new Error("Only QA (john) can mark done");
      }
      if (!data.qaApproved) {
        throw new Error("QA approval required to mark done");
      }
      updates.push("qa_approved = ?");
      params.push(1);
    } else if (data.qaApproved !== undefined) {
      updates.push("qa_approved = ?");
      params.push(data.qaApproved ? 1 : 0);
    }
    updates.push("status = ?");
    params.push(data.status);
  }
  if (data.assignedAgent !== undefined) {
    updates.push("assigned_agent = ?");
    params.push(data.assignedAgent);
  }
  if (data.securityFlagged !== undefined) {
    updates.push("security_flagged = ?");
    params.push(data.securityFlagged ? 1 : 0);
  }
  if (data.inputTokens !== undefined) {
    updates.push("input_tokens = ?");
    params.push(Number(data.inputTokens) || 0);
  }
  if (data.outputTokens !== undefined) {
    updates.push("output_tokens = ?");
    params.push(Number(data.outputTokens) || 0);
  }
  if (data.project !== undefined) {
    updates.push("project = ?");
    params.push(data.project);
  }

  updates.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(data.id);

  await db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params);
  const updated = await db.get<TaskRow>("SELECT * FROM tasks WHERE id = ?", data.id);
  return format(updated!);
}
