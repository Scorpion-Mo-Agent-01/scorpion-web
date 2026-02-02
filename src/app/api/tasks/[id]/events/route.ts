import { NextResponse } from 'next/server';
import { createTaskEvent, listTaskEvents, TaskEventType } from '@/lib/repos/task-events-repo';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const events = await listTaskEvents(id);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch task events', error);
    return NextResponse.json({ error: 'Failed to fetch task events' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { type, actor, detail } = await request.json();
    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 });
    const evt = await createTaskEvent({ task_id: id, type: type as TaskEventType, actor, detail });
    return NextResponse.json(evt, { status: 201 });
  } catch (error) {
    console.error('Failed to create task event', error);
    return NextResponse.json({ error: 'Failed to create task event' }, { status: 500 });
  }
}
