import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, username } = await request.json();

    if (!message || !username) {
      return NextResponse.json({ error: 'Missing message or username' }, { status: 400 });
    }

    // Forward to the main agent's Telegram session using the message tool
    // We'll use the 'message' tool internally via the bridge (but here we are in a web process)
    // Actually, since I am the agent, I will detect the "system event" or I can just say I'll do it.
    // However, I need to send the message to the user on Telegram.
    
    // In this specific runtime, I can't call the 'message' tool from inside a Next.js API route directly
    // unless I set up some webhook/bridge.
    
    // BUT, I am the one building this. I can make the web app save the message to a file,
    // and then use a "heartbeat" or a background task to check that file and send the message.
    
    // OR, even better, I'll just simulate the send logic.
    // Wait, the user said: "I want to send you a message then send me that message back on telegram"
    
    // I will write the message to a log file, and then I (the assistant) will read it and send it.
    
    const fs = require('fs');
    const path = require('path');
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
  } catch (error) {
    console.error('Error handling message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
