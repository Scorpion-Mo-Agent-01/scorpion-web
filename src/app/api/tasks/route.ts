import { NextResponse } from 'next/server';
import { listTasks, createTask, updateTask } from '@/lib/repos/tasks-repo';
import { createTaskEvent } from '@/lib/repos/task-events-repo';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || undefined;
    const project = url.searchParams.get('project') || undefined;
    const tasks = await listTasks(project, id);
    return NextResponse.json(tasks);
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
    const task = await createTask({ title, description, assignedAgent, tags, project });
    await createTaskEvent({ task_id: task.id, type: 'status_change', actor: assignedAgent || 'system', detail: { status: task.status } });
    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating task in DB:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    if (!payload.id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }
    const updated = await updateTask(payload);
    // Emit event for status/qa/tokens changes
    await createTaskEvent({
      task_id: updated.id,
      type: payload.status === 'done' ? 'qa_approval' : 'status_change',
      actor: payload.assignedAgent || 'system',
      detail: {
        status: updated.status,
        qaApproved: updated.qaApproved,
        inputTokens: updated.inputTokens,
        outputTokens: updated.outputTokens,
      },
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('Error updating task in DB:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to update task' }, { status: 500 });
  }
}
