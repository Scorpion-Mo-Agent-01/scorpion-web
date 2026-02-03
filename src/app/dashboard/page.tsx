"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { GlobalHeader } from "@/components/dashboard/global-header";
import { AgentRoster } from "@/components/dashboard/agent-roster";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { LoadingScreen, ErrorScreen } from "@/components/dashboard/dashboard-states";
import { WorkflowBoardWithProvider } from "@/components/workflows/workflow-board";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  const { tasks, agents, error, loading } = useDashboardData(token, "default");
  const [shieldStatus, setShieldStatus] = useState<"online" | "threat">("online");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShieldStatus(tasks.some((t) => t.securityFlagged) ? "threat" : "online");
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks]);

  if (status === "loading" || loading) return <LoadingScreen />;
  if (status === "unauthenticated") return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  const agentsActive = agents.filter((a) => a.status === "WORKING").length;
  const tasksInQueue = tasks.filter((t) => ["inbox", "assigned", "in progress"].includes(t.status)).length;
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter((t) => ["done", "review"].includes(t.status)).length / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col overflow-auto">
      <GlobalHeader agentsActive={agentsActive} tasksInQueue={tasksInQueue} completionRate={completionRate} shieldStatus={shieldStatus} />

      <div className="flex-1 flex pt-20 gap-4 px-6">
        <AgentRoster
          className="w-64"
          agents={agents}
          onAgentClick={() => {}}
        />

        <main className="flex-1 flex flex-col overflow-hidden space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Workflow Orchestrator</h1>
              <button
                onClick={() => router.push("/dashboard/workflows")}
                className="px-4 py-2 border border-white/20 text-sm uppercase rounded hover:border-white"
              >
                Open Fullscreen
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <WorkflowBoardWithProvider />
          </div>

          <div className="grid grid-cols-2 gap-4 h-64">
            <LiveFeed token={token} />
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 text-sm text-white/80">
              <div className="font-semibold mb-2">Telemetry</div>
              <p className="text-xs text-white/60">Node-level status, token usage, and tool calls surface in the workflow board inspector.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
