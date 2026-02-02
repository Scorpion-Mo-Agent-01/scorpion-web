import { getDb } from "@/lib/db";

export type AgentRecord = {
  id: string;
  name: string;
  emoji?: string;
  role?: string;
  level?: string;
  status?: string;
  currentTask?: string | null;
  skills?: string[];
  system_prompt?: string | null;
  memory_cloud?: string | null;
};

type AgentRow = {
  id: string;
  name: string;
  emoji?: string;
  role?: string;
  level?: string;
  status?: string;
  currentTask?: string | null;
  skills?: string | null;
  system_prompt?: string | null;
  memory_cloud?: string | null;
};

export async function listAgents(id?: string) {
  const db = await getDb();
  const rows: AgentRow[] = id ? await db.all("SELECT * FROM agents WHERE id = ?", id) : await db.all("SELECT * FROM agents");
  return rows.map((r) => ({
    ...r,
    skills: r.skills ? JSON.parse(r.skills) : [],
  }));
}

export async function updateAgent(agent: Partial<AgentRecord> & { id: string }) {
  const db = await getDb();
  const updates: string[] = [];
  const params: (string | null)[] = [];

  const push = (field: string, value: string | null) => {
    updates.push(`${field} = ?`);
    params.push(value);
  };

  if (agent.status !== undefined) push("status", agent.status);
  if (agent.currentTask !== undefined) push("currentTask", agent.currentTask);
  if (agent.skills !== undefined) push("skills", JSON.stringify(agent.skills));
  if (agent.system_prompt !== undefined) push("system_prompt", agent.system_prompt);
  if (agent.memory_cloud !== undefined) push("memory_cloud", agent.memory_cloud);
  if (agent.role !== undefined) push("role", agent.role);
  if (agent.level !== undefined) push("level", agent.level);
  if (agent.emoji !== undefined) push("emoji", agent.emoji);
  if (agent.name !== undefined) push("name", agent.name);

  if (!updates.length) return listAgents(agent.id);

  params.push(agent.id);
  await db.run(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`, params);
  const [updated] = await listAgents(agent.id);
  return updated;
}

export async function seedAgentIfMissing(agent: AgentRecord) {
  const db = await getDb();
  const existing = await db.get("SELECT id FROM agents WHERE id = ?", agent.id);
  if (!existing) {
    await db.run(
      `INSERT INTO agents (id, name, emoji, role, level, status, currentTask, skills, system_prompt, memory_cloud)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agent.id,
        agent.name,
        agent.emoji || null,
        agent.role || null,
        agent.level || null,
        agent.status || "IDLE",
        agent.currentTask || null,
        agent.skills ? JSON.stringify(agent.skills) : JSON.stringify([]),
        agent.system_prompt || null,
        agent.memory_cloud || null,
      ]
    );
  }
}
