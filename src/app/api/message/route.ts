import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { message, username } = await request.json();

    if (!message || !username) {
      return NextResponse.json({ error: 'Missing message or username' }, { status: 400 });
    }

    const logPath = path.join(process.cwd(), 'data', 'telegram_queue.jsonl');
    
    // Ensure dir exists
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const payload = JSON.stringify({
      target: "5642534663", // Mo's ID from AGENTS.md
      message: `[PORTAL] ${username}: ${message}`
    });

    fs.appendFileSync(logPath, payload + '\n');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error handling message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
