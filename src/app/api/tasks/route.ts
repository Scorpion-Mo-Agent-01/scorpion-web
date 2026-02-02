import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.join(process.cwd(), '..', '..', 'memory', 'memory.db');

async function getDb() {
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
      assignedAgent TEXT,
      tags TEXT,
      securityFlagged INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);
  return db;
}

export async function GET() {
  try {
    const db = await initDb();
    const tasks = await db.all('SELECT * FROM tasks ORDER BY createdAt DESC');
    
    // Parse tags back to array
    const formattedTasks = tasks.map(t => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : [],
      securityFlagged: Boolean(t.securityFlagged)
    }));

    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error('Error reading tasks from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, assignedAgent, tags } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const db = await initDb();
    const id = Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    const status = assignedAgent ? 'assigned' : 'inbox';

    await db.run(
      `INSERT INTO tasks (id, title, description, status, assignedAgent, tags, securityFlagged, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title.trim(),
        description?.trim() || null,
        status,
        assignedAgent || null,
        tags ? JSON.stringify(tags) : JSON.stringify([]),
        0,
        createdAt
      ]
    );

    return NextResponse.json({ id, title, status }, { status: 201 });
  } catch (error) {
    console.error('Error creating task in DB:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, assignedAgent, securityFlagged } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const db = await initDb();
    const updatedAt = new Date().toISOString();

    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (assignedAgent !== undefined) {
      updates.push('assignedAgent = ?');
      params.push(assignedAgent);
    }
    if (securityFlagged !== undefined) {
      updates.push('securityFlagged = ?');
      params.push(securityFlagged ? 1 : 0);
    }
    
    updates.push('updatedAt = ?');
    params.push(updatedAt);
    params.push(id);

    const result = await db.run(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task in DB:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
