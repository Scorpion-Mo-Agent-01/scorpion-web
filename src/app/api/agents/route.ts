import { NextResponse } from 'next/server';
import { listAgents, updateAgent } from '@/lib/repos/agents-repo';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id') || undefined;
    const agents = await listAgents(id);
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    if (!payload.id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }
    const updated = await updateAgent(payload);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}
