"use client";

import { useEffect, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { GlobalHeader } from "@/components/dashboard/global-header";
import { AgentRoster } from "@/components/dashboard/agent-roster";
import { AgentEditModal } from "@/components/dashboard/agent-edit-modal";
import { TaskCreateModal } from "@/components/dashboard/task-create-modal";
import { EnhancedKanbanColumn } from "@/components/dashboard/enhanced-kanban-column";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { EnhancedTaskCard } from "@/components/dashboard/enhanced-task-card";
import { TaskDetailDrawer } from "@/components/dashboard/task-detail-drawer";

import { useDashboardData, Agent, Task } from "@/hooks/use-dashboard-data";
import { useKanbanDrag } from "@/hooks/use-kanban-drag";

import { LoadingScreen, ErrorScreen } from "@/components/dashboard/dashboard-states";

const COLUMNS = [
  { title: "Inbox", status: "inbox" },
  { title: "Assigned", status: "assigned" },
  { title: "In Progress", status: "in progress" },
  { title: "Review", status: "review" },
  { title: "Done", status: "done" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [project, setProject] = useState("default");
  const { tasks, agents, error, updateTaskStatus, setTasks, createTask, updateAgent } = useDashboardData(token, project);
  const projects = Array.from(new Set(["default", ...tasks.map((t) => t.project || "default")])).sort();
  const { activeTask, handleDragStart, handleDragEnd } = useKanbanDrag(tasks, COLUMNS, updateTaskStatus, setTasks);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [shieldStatus, setShieldStatus] = useState<"online" | "threat">("online");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setShieldStatus(tasks.some((t) => t.securityFlagged) ? "threat" : "online");
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  const agentsActive = agents.filter((a) => a.status === "WORKING").length;
  const tasksInQueue = tasks.filter((t) => ["inbox", "assigned", "in progress"].includes(t.status)).length;
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "done" || t.status === "review").length / tasks.length) * 100) : 0;

  return (
    <div className="h-screen bg-[#0b0b0f] text-white flex flex-col overflow-hidden">
      <GlobalHeader agentsActive={agentsActive} tasksInQueue={tasksInQueue} completionRate={completionRate} shieldStatus={shieldStatus} />

      <div className="flex-1 flex overflow-hidden pt-20 gap-4 px-6">
        <AgentRoster
          className="w-64"
          agents={agents}
          onAgentClick={(agent) => { setSelectedAgent(agent); setShowAgentModal(true); }}
        />

        <main className="flex-1 flex flex-col overflow-hidden space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Mission Queue</h1>
              <button
                onClick={() => router.push("/dashboard/workflows")}
                className="px-4 py-2 border border-white/20 text-sm uppercase rounded hover:border-white"
              >
                Workflow Studio
              </button>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span>Project</span>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value || "default")}
                  className="bg-slate-900 border border-white/20 px-2 py-1 rounded text-xs text-white"
                >
                  {projects.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const name = prompt("New project name")?.trim();
                    if (name) setProject(name);
                  }}
                  className="px-2 py-1 border border-white/20 rounded text-xs hover:border-white"
                >
                  + New
                </button>
              </div>
              <div className="relative">
                <details className="bg-slate-900 border border-white/10 rounded">
                  <summary className="px-3 py-2 text-xs uppercase text-white/80 cursor-pointer">Skill Lab</summary>
                  <div className="absolute mt-2 w-64 bg-slate-900 border border-white/10 rounded shadow-lg p-2 space-y-2 z-10">
                    {agents.flatMap((a) => a.skills).filter(Boolean).slice(0,10).map((skill) => (
                      <div key={skill} className="text-xs text-white/80 px-2 py-1 bg-slate-800 rounded border border-white/10">{skill}</div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
            <button onClick={() => setShowTaskModal(true)} className="px-6 py-2 bg-white text-slate-950 font-bold uppercase text-sm rounded hover:bg-zinc-200 transition-colors">
              + New Task
            </button>
          </div>

          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex-1 flex gap-3 overflow-hidden mb-6">
              {COLUMNS.map((column) => (
                <div key={column.status} className="flex-1 min-w-0 bg-slate-900/60 border border-slate-800 rounded-lg">
                  <EnhancedKanbanColumn
                    title={column.title}
                    status={column.status}
                    tasks={tasks.filter((task) => task.status === column.status)}
                    onStatusChange={updateTaskStatus}
                    onTaskClick={(task) => setSelectedTask(task)}
                  />
                </div>
              ))}
            </div>
            {typeof window !== 'undefined' && createPortal(
              <DragOverlay>{activeTask ? <EnhancedTaskCard {...activeTask} /> : null}</DragOverlay>,
              document.body
            )}
          </DndContext>

          <div className="grid grid-cols-2 gap-4 h-64">
            <LiveFeed token={token} />
            {/* SkillLab moved to dropdown */}
          </div>
        </main>
      </div>

      {selectedAgent && (
        <AgentEditModal
          key={selectedAgent.id}
          agent={selectedAgent}
          isOpen={showAgentModal}
          onClose={() => { setShowAgentModal(false); setSelectedAgent(null); }}
          onSave={updateAgent}
        />
      )}

      <TaskCreateModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSubmit={createTask}
        agents={agents}
        defaultProject={project}
      />

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
