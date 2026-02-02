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

export async function GET() {
  try {
    const db = await getDb();
    const agents = await db.all('SELECT * FROM agents');
    
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
    const { id, status, currentTask, skills } = await request.json();
    const db = await getDb();

    const updates = [];
    const params = [];

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

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(id);
    await db.run(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}
