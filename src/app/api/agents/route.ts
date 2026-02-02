import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const dbPath = path.join(process.cwd(), 'data', 'agents.db');

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
    )
  `);
  // Backfill columns if missing
  const cols = await db.all<{ name: string }[]>(`PRAGMA table_info(agents);`);
  const colNames = cols.map((c) => c.name);
  if (!colNames.includes("system_prompt")) {
    await db.exec(`ALTER TABLE agents ADD COLUMN system_prompt TEXT`);
  }
  if (!colNames.includes("memory_cloud")) {
    await db.exec(`ALTER TABLE agents ADD COLUMN memory_cloud TEXT`);
  }
  return db;
}

export async function GET(request: Request) {
  try {
    const db = await initDb();
    const id = new URL(request.url).searchParams.get('id');

    let agents;
    if (id) {
      agents = await db.all('SELECT * FROM agents WHERE id = ?', id);
    } else {
      agents = await db.all('SELECT * FROM agents');
    }
    
    const formattedAgents = agents.map(a => ({
      ...a,
      skills: a.skills ? JSON.parse(a.skills) : []
    }));

    return NextResponse.json(formattedAgents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, currentTask, skills, system_prompt, memory_cloud } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const db = await initDb();

    const updates: string[] = [];
    const params: (string | null)[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (currentTask !== undefined) {
      updates.push('currentTask = ?');
      params.push(currentTask);
    }
    if (skills !== undefined) {
      updates.push('skills = ?');
      params.push(JSON.stringify(skills));
    }
    if (system_prompt !== undefined) {
      updates.push('system_prompt = ?');
      params.push(system_prompt);
    }
    if (memory_cloud !== undefined) {
      updates.push('memory_cloud = ?');
      params.push(memory_cloud);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(id);
    const result = await db.run(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`, params);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const updatedAgent = await db.get('SELECT * FROM agents WHERE id = ?', id);
    const formattedUpdatedAgent = {
      ...updatedAgent,
      skills: updatedAgent.skills ? JSON.parse(updatedAgent.skills) : []
    };

    return NextResponse.json(formattedUpdatedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}
