"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalHeader } from "@/components/dashboard/global-header";
import { AgentRoster } from "@/components/dashboard/agent-roster";
import { AgentEditModal } from "@/components/dashboard/agent-edit-modal";
import { TaskCreateModal } from "@/components/dashboard/task-create-modal";
import { EnhancedKanbanColumn } from "@/components/dashboard/enhanced-kanban-column";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { SkillLab } from "@/components/dashboard/skill-lab";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignedAgent?: string;
  status: string;
  tags?: string[];
  securityFlagged?: boolean;
}

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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [shieldStatus, setShieldStatus] = useState<"online" | "threat">("online");

  const columns = [
    { title: "Inbox", status: "inbox" },
    { title: "Assigned", status: "assigned" },
    { title: "In Progress", status: "in progress" },
    { title: "Review", status: "review" },
    { title: "Done", status: "done" },
  ];

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Task[] = await response.json();
      setTasks(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      console.error("Failed to fetch tasks:", e);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Agent[] = await response.json();
      setAgents(data);
    } catch (e: any) {
      console.error("Failed to fetch agents:", e);
    }
  };

  const handleAgentSave = async (agent: Agent) => {
    try {
      const response = await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agent.id,
          status: agent.status,
          currentTask: agent.currentTask,
          skills: agent.skills,
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await fetchAgents();
    } catch (e: any) {
      console.error("Failed to update agent:", e);
      alert(`Error: ${e.message}`);
    }
  };

  const handleTaskCreate = async (taskData: {
    title: string;
    description: string;
    assignedAgent?: string;
    tags: string[];
  }) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          assignedAgent: taskData.assignedAgent,
          tags: taskData.tags,
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await fetchTasks();
    } catch (e: any) {
      console.error("Failed to create task:", e);
      alert(`Error: ${e.message}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await fetchTasks();
    } catch (e: any) {
      console.error("Failed to update task status:", e);
      alert(`Error: ${e.message}`);
    }
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentModal(true);
  };

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (!isLoggedIn) {
        router.push("/");
        return;
      }
      await Promise.all([fetchTasks(), fetchAgents()]);
      setLoading(false);
    };
    checkAuthAndFetchData();

    // Check for high priority/flagged tasks to set shield status
    const interval = setInterval(() => {
      if (tasks.some(t => t.securityFlagged)) {
        setShieldStatus("threat");
      } else {
        setShieldStatus("online");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router, tasks]);

  const agentsActive = agents.filter((a) => a.status === "WORKING").length;
  const tasksInQueue = tasks.filter((t) =>
    ["inbox", "assigned", "in progress"].includes(t.status)
  ).length;
  const completionRate =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.status === "done" || t.status === "review").length /
            tasks.length) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦂</div>
          <p className="text-lg font-mono">Initializing Obsidian Control...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-500 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">System Error</p>
          <p className="text-sm text-zinc-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <GlobalHeader
        agentsActive={agentsActive}
        tasksInQueue={tasksInQueue}
        completionRate={completionRate}
        shieldStatus={shieldStatus}
      />

      <div className="flex-1 flex overflow-hidden pt-20">
        <AgentRoster agents={agents} onAgentClick={handleAgentClick} />

        <main className="flex-1 flex flex-col p-6 ml-80 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Mission Queue</h1>
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-6 py-2 bg-white text-slate-950 font-bold uppercase text-sm rounded hover:bg-zinc-200 transition-colors"
            >
              + New Task
            </button>
          </div>

          <div className="flex-1 flex gap-4 overflow-hidden mb-6">
            {columns.map((column) => (
              <div key={column.status} className="flex-1 min-w-0">
                <EnhancedKanbanColumn
                  title={column.title}
                  tasks={tasks.filter((task) => task.status === column.status)}
                  onStatusChange={handleStatusChange}
                  onTaskClick={(task) => console.log("Task clicked:", task)}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 h-64">
            <LiveFeed />
            <SkillLab />
          </div>
        </main>
      </div>

      {selectedAgent && (
        <AgentEditModal
          agent={selectedAgent}
          isOpen={showAgentModal}
          onClose={() => {
            setShowAgentModal(false);
            setSelectedAgent(null);
          }}
          onSave={handleAgentSave}
        />
      )}

      <TaskCreateModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSubmit={handleTaskCreate}
        agents={agents}
      />
    </div>
  );
}
