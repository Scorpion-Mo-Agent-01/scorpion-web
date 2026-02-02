import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import crypto from "crypto";
import { open, Database } from "sqlite";

const dbPath = path.join(process.cwd(), "data", "tasks.db");

async function ensureDir() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

async function ensureWorkflowColumns(db: Database) {
  const cols = await db.all<{ name: string }[]>("PRAGMA table_info(workflow_nodes);");
  const colNames = cols.map((c) => c.name);
  const addCol = async (name: string, ddl: string) => {
    if (!colNames.includes(name)) {
      await db.exec(`ALTER TABLE workflow_nodes ADD COLUMN ${ddl}`);
    }
  };

  await addCol("assignee_agent_id", "TEXT");
  await addCol("status", "TEXT DEFAULT 'idle'");
  await addCol("model_name", "TEXT");
  await addCol("input_tokens", "INTEGER DEFAULT 0");
  await addCol("output_tokens", "INTEGER DEFAULT 0");
  await addCol("skills_used", "TEXT");
  await addCol("time_spent_ms", "INTEGER DEFAULT 0");
  await addCol("context_summary", "TEXT");
  await addCol("telemetry", "TEXT");
  await addCol("order_index", "INTEGER");
}

export async function getWorkflowDb(): Promise<Database> {
  await ensureDir();
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 0,
      created_by TEXT,
      version INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS workflow_nodes (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      node_key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT,
      assignee_role TEXT,
      assignee_agent_id TEXT,
      status TEXT,
      model_name TEXT,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      skills_used TEXT,
      time_spent_ms INTEGER DEFAULT 0,
      context_summary TEXT,
      telemetry TEXT,
      order_index INTEGER,
      metadata TEXT,
      ui_position TEXT,
      created_at TEXT,
      updated_at TEXT,
      UNIQUE(workflow_id, node_key)
    );

    CREATE TABLE IF NOT EXISTS workflow_edges (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      from_node_id TEXT NOT NULL,
      to_node_id TEXT NOT NULL,
      condition TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS intake_requests (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      submitted_by TEXT,
      payload TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT,
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS generated_tasks (
      id TEXT PRIMARY KEY,
      intake_request_id TEXT NOT NULL,
      workflow_node_id TEXT NOT NULL,
      title TEXT,
      description TEXT,
      assignee_role TEXT,
      status TEXT,
      inbox_task_id TEXT,
      error_msg TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await ensureWorkflowColumns(db);
  return db;
}

export type WorkflowNodeInput = {
  id?: string;
  node_key: string;
  title: string;
  description?: string;
  type?: string;
  assignee_role?: string;
  assignee_agent_id?: string;
  status?: string;
  model_name?: string;
  input_tokens?: number;
  output_tokens?: number;
  skills_used?: string[];
  time_spent_ms?: number;
  context_summary?: string;
  telemetry?: Record<string, unknown>;
  order_index?: number;
  metadata?: Record<string, unknown>;
  ui_position?: { x: number; y: number };
};

export type WorkflowEdgeInput = {
  id?: string;
  from_node_id: string;
  to_node_id: string;
  condition?: Record<string, unknown>;
};

export async function replaceWorkflowGraph(db: Database, workflowId: string, nodes: WorkflowNodeInput[], edges: WorkflowEdgeInput[]) {
  await db.run("DELETE FROM workflow_edges WHERE workflow_id = ?", workflowId);
  await db.run("DELETE FROM workflow_nodes WHERE workflow_id = ?", workflowId);

  const now = new Date().toISOString();
  for (const node of nodes) {
    await db.run(
      `INSERT INTO workflow_nodes (id, workflow_id, node_key, title, description, type, assignee_role, assignee_agent_id, status, model_name, input_tokens, output_tokens, skills_used, time_spent_ms, context_summary, telemetry, order_index, metadata, ui_position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        node.id || crypto.randomUUID(),
        workflowId,
        node.node_key,
        node.title,
        node.description || null,
        node.type || "task",
        node.assignee_role || null,
        node.assignee_agent_id || null,
        node.status || "idle",
        node.model_name || null,
        node.input_tokens ?? 0,
        node.output_tokens ?? 0,
        node.skills_used ? JSON.stringify(node.skills_used) : null,
        node.time_spent_ms ?? 0,
        node.context_summary || null,
        node.telemetry ? JSON.stringify(node.telemetry) : null,
        node.order_index ?? null,
        node.metadata ? JSON.stringify(node.metadata) : null,
        node.ui_position ? JSON.stringify(node.ui_position) : JSON.stringify({ x: 0, y: 0 }),
        now,
        now,
      ]
    );
  }

  for (const edge of edges) {
    await db.run(
      `INSERT INTO workflow_edges (id, workflow_id, from_node_id, to_node_id, condition, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        edge.id || crypto.randomUUID(),
        workflowId,
        edge.from_node_id,
        edge.to_node_id,
        edge.condition ? JSON.stringify(edge.condition) : null,
        now,
        now,
      ]
    );
  }
}

export async function fetchWorkflowWithGraph(db: Database, workflowId: string) {
  const workflow = await db.get("SELECT * FROM workflows WHERE id = ?", workflowId);
  if (!workflow) return null;
  const nodes = await db.all("SELECT * FROM workflow_nodes WHERE workflow_id = ?", workflowId);
  const edges = await db.all("SELECT * FROM workflow_edges WHERE workflow_id = ?", workflowId);
  const parsedNodes = nodes.map((node) => ({
    ...node,
    metadata: node.metadata ? JSON.parse(node.metadata) : null,
    ui_position: node.ui_position ? JSON.parse(node.ui_position) : null,
    skills_used: node.skills_used ? JSON.parse(node.skills_used) : [],
    telemetry: node.telemetry ? JSON.parse(node.telemetry) : null,
  }));
  return { workflow, nodes: parsedNodes, edges };
}
