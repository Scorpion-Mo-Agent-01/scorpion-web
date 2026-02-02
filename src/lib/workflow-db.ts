import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import crypto from "crypto";
import { open, Database } from "sqlite";

const dbPath = path.join(process.cwd(), "data", "tasks.db");

async function ensureDir() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
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
  return db;
}

export type WorkflowNodeInput = {
  id?: string;
  node_key: string;
  title: string;
  description?: string;
  type?: string;
  assignee_role?: string;
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
      `INSERT INTO workflow_nodes (id, workflow_id, node_key, title, description, type, assignee_role, metadata, ui_position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        node.id || crypto.randomUUID(),
        workflowId,
        node.node_key,
        node.title,
        node.description || null,
        node.type || "task",
        node.assignee_role || null,
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
  return { workflow, nodes, edges };
}
