"use client";

import { motion } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  level: string;
  role: string;
  status: "WORKING" | "IDLE" | "BLOCKED";
  currentTask: string | null;
  skills: string[];
}

interface AgentRosterProps {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
  className?: string;
}

export function AgentRoster({ agents, onAgentClick, className }: AgentRosterProps) {
  return (
    <aside
      className={`shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto sticky top-20 h-[calc(100vh-5rem)] ${className ?? "w-64"}`}
    >
      <div className="p-4">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono mb-4">
          Agent Roster
        </h2>
        <div className="space-y-2">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onClick={() => onAgentClick(agent)} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const statusColors = {
    WORKING: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    IDLE: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
    BLOCKED: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="bg-slate-800 border border-slate-700 rounded-md p-3 cursor-pointer hover:border-slate-600 transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{agent.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{agent.name}</h3>
          <p className="text-xs text-zinc-400 truncate mb-1">{agent.role}</p>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded border ${
                statusColors[agent.status]
              }`}
            >
              {agent.status}
            </span>
          </div>
          {agent.currentTask && (
            <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
              {agent.currentTask}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
