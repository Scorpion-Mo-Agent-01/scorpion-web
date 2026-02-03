import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const dbPath = path.join(process.cwd(), "data", "tasks.db");
let dbInstance: Database | null = null;
let initialized = false;

async function ensureDir() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

async function applyMigrations(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      assigned_agent TEXT,
      tags TEXT,
      project TEXT,
      security_flagged INTEGER DEFAULT 0,
      qa_approved INTEGER DEFAULT 0,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT,
      emoji TEXT,
      role TEXT,
      level TEXT,
      status TEXT,
      currentTask TEXT,
      skills TEXT,
      system_prompt TEXT,
      memory_cloud TEXT
    );
    CREATE TABLE IF NOT EXISTS task_questions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      agent_id TEXT,
      question TEXT NOT NULL,
      answer TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT,
      updated_at TEXT
    );
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
  // Ensure new columns exist
  const tableCols = async (table: string) => (await db.all<{ name: string }[]>(`PRAGMA table_info(${table});`)).map(c => c.name);
  const ensureCol = async (table: string, name: string, ddl: string) => {
    if (!(await tableCols(table)).includes(name)) {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${ddl}`);
    }
  };

  const taskCols = await tableCols("tasks");
  if (!taskCols.includes("project")) await ensureCol("tasks", "project", "TEXT");
  if (!taskCols.includes("qa_approved")) await ensureCol("tasks", "qa_approved", "INTEGER DEFAULT 0");
  if (!taskCols.includes("input_tokens")) await ensureCol("tasks", "input_tokens", "INTEGER DEFAULT 0");
  if (!taskCols.includes("output_tokens")) await ensureCol("tasks", "output_tokens", "INTEGER DEFAULT 0");

  const agentCols = await tableCols("agents");
  if (!agentCols.includes("system_prompt")) await ensureCol("agents", "system_prompt", "TEXT");
  if (!agentCols.includes("memory_cloud")) await ensureCol("agents", "memory_cloud", "TEXT");

  const workflowNodeCols = await tableCols("workflow_nodes");
  if (!workflowNodeCols.includes("assignee_agent_id")) await ensureCol("workflow_nodes", "assignee_agent_id", "TEXT");
  if (!workflowNodeCols.includes("status")) await ensureCol("workflow_nodes", "status", "TEXT DEFAULT 'idle'");
  if (!workflowNodeCols.includes("model_name")) await ensureCol("workflow_nodes", "model_name", "TEXT");
  if (!workflowNodeCols.includes("input_tokens")) await ensureCol("workflow_nodes", "input_tokens", "INTEGER DEFAULT 0");
  if (!workflowNodeCols.includes("output_tokens")) await ensureCol("workflow_nodes", "output_tokens", "INTEGER DEFAULT 0");
  if (!workflowNodeCols.includes("skills_used")) await ensureCol("workflow_nodes", "skills_used", "TEXT");
  if (!workflowNodeCols.includes("time_spent_ms")) await ensureCol("workflow_nodes", "time_spent_ms", "INTEGER DEFAULT 0");
  if (!workflowNodeCols.includes("context_summary")) await ensureCol("workflow_nodes", "context_summary", "TEXT");
  if (!workflowNodeCols.includes("telemetry")) await ensureCol("workflow_nodes", "telemetry", "TEXT");
  if (!workflowNodeCols.includes("order_index")) await ensureCol("workflow_nodes", "order_index", "INTEGER");
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  await ensureDir();
  dbInstance = await open({ filename: dbPath, driver: sqlite3.Database });
  if (!initialized) {
    await applyMigrations(dbInstance);
    initialized = true;
  }
  return dbInstance;
}
