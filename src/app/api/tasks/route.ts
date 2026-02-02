import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const dbPath = path.join(process.cwd(), 'data', 'tasks.db');

async function ensureDbDir() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

async function getDb() {
  await ensureDbDir();
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

async function initDb() {
  const db = await getDb();
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
    )
  `);
  // ensure columns exist
  const cols = await db.all<{ name: string }[]>(`PRAGMA table_info(tasks);`);
  const colNames = cols.map((c) => c.name);
  if (!colNames.includes("qa_approved")) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN qa_approved INTEGER DEFAULT 0`);
  }
  if (!colNames.includes("input_tokens")) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN input_tokens INTEGER DEFAULT 0`);
  }
  if (!colNames.includes("output_tokens")) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN output_tokens INTEGER DEFAULT 0`);
  }
  if (!colNames.includes("project")) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN project TEXT`);
  }
  return db;
}

function formatTask(row: unknown) {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  return {
    id: record.id as string,
    title: record.title as string,
    description: record.description as string | undefined,
    status: record.status as string,
    assignedAgent: record.assigned_agent as string | undefined,
    tags: record.tags ? JSON.parse(record.tags as string) : [],
    project: record.project as string | undefined,
    securityFlagged: Boolean(record.security_flagged),
    qaApproved: Boolean(record.qa_approved),
    inputTokens: Number(record.input_tokens || 0),
    outputTokens: Number(record.output_tokens || 0),
    createdAt: record.created_at as string | undefined,
    updatedAt: record.updated_at as string | undefined,
  };
}

export async function GET(request: Request) {
  try {
    const db = await initDb();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const project = url.searchParams.get('project');

    let tasks;
    if (id) {
      tasks = await db.all('SELECT * FROM tasks WHERE id = ?', id);
    } else if (project) {
      tasks = await db.all('SELECT * FROM tasks WHERE project = ? ORDER BY created_at DESC', project);
    } else {
      tasks = await db.all('SELECT * FROM tasks ORDER BY created_at DESC');
    }
    
    const formattedTasks = tasks.map(formatTask).filter(Boolean);

    return NextResponse.json(formattedTasks);
  } catch (error: unknown) {
    console.error('Error reading tasks from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, assignedAgent, tags, project } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const db = await initDb();
    const id = Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    const status = assignedAgent ? 'assigned' : 'inbox';

    await db.run(
      `INSERT INTO tasks (id, title, description, status, assigned_agent, tags, project, security_flagged, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title.trim(),
        description?.trim() || null,
        status,
        assignedAgent || null,
        tags ? JSON.stringify(tags) : JSON.stringify([]),
        project || 'default',
        0,
        createdAt
      ]
    );

    const newTask = await db.get('SELECT * FROM tasks WHERE id = ?', id);
    return NextResponse.json(formatTask(newTask), { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating task in DB:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, assignedAgent, securityFlagged, qaApproved, inputTokens, outputTokens } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const db = await initDb();
    const updatedAt = new Date().toISOString();

    const existing = await db.get('SELECT * FROM tasks WHERE id = ?', id);
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (status !== undefined) {
      if (status === 'done') {
        if (existing.assigned_agent !== 'john') {
          return NextResponse.json({ error: 'Only QA (john) can mark done' }, { status: 400 });
        }
        if (!qaApproved) {
          return NextResponse.json({ error: 'QA approval required to mark done' }, { status: 400 });
        }
        updates.push('qa_approved = ?');
        params.push(1);
      } else if (qaApproved !== undefined) {
        updates.push('qa_approved = ?');
        params.push(qaApproved ? 1 : 0);
      }
      updates.push('status = ?');
      params.push(status);
    }
    if (assignedAgent !== undefined) {
      updates.push('assigned_agent = ?');
      params.push(assignedAgent);
    }
    if (securityFlagged !== undefined) {
      updates.push('security_flagged = ?');
      params.push(securityFlagged ? 1 : 0);
    }
    if (inputTokens !== undefined) {
      updates.push('input_tokens = ?');
      params.push(Number(inputTokens) || 0);
    }
    if (outputTokens !== undefined) {
      updates.push('output_tokens = ?');
      params.push(Number(outputTokens) || 0);
    }
    
    updates.push('updated_at = ?');
    params.push(updatedAt);
    params.push(id);

    const result = await db.run(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', id);
    return NextResponse.json(formatTask(updatedTask));
  } catch (error: unknown) {
    console.error('Error updating task in DB:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
