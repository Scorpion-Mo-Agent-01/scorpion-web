"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

import { LoadingScreen, ErrorScreen } from "@/components/dashboard/dashboard-states";

type NodeData = {
  label: string;
  assignee?: string;
  type?: string;
  description?: string;
};

interface WorkflowNodeRow {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  assignee_role?: string | null;
  ui_position?: string | null;
}

interface WorkflowEdgeRow {
  id: string;
  from_node_id: string;
  to_node_id: string;
}

interface WorkflowRecord {
  id: string;
  name: string;
  description?: string | null;
  is_active?: number;
  nodes?: WorkflowNodeRow[];
  edges?: WorkflowEdgeRow[];
}

interface IntakeStatus {
  id: string;
  status: string;
}

export default function WorkflowPage() {
  const { status } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowRecord | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [newNode, setNewNode] = useState({ title: "", assignee: "", type: "task" });
  const [newEdge, setNewEdge] = useState({ from: "", to: "" });
  const [intakePayload, setIntakePayload] = useState("{\n  \"summary\": \"\"\n}");
  const [intakeStatus, setIntakeStatus] = useState<IntakeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      if (!res.ok) throw new Error("Failed to load workflows");
      const data: WorkflowRecord[] = await res.json();
      setWorkflows(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load workflows";
      setError(message);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const selectWorkflow = useCallback((wf: WorkflowRecord) => {
    setActiveWorkflow(wf);
    const rfNodes: Node<NodeData>[] = (wf.nodes || []).map((n) => ({
      id: n.id,
      data: { label: n.title, assignee: n.assignee_role ?? "", type: n.type ?? "task" },
      position: n.ui_position ? JSON.parse(n.ui_position) : { x: 0, y: 0 },
      type: "default",
    }));
    const rfEdges: Edge[] = (wf.edges || []).map((e) => ({
      id: e.id,
      source: e.from_node_id,
      target: e.to_node_id,
    }));
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [setEdges, setNodes]);

  const handleConnect = (connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, id: crypto.randomUUID() }, eds));
  };

  const handleAddNode = () => {
    if (!newNode.title.trim()) return;
    const id = crypto.randomUUID();
    setNodes((prev) => [
      ...prev,
      {
        id,
        data: { label: newNode.title, assignee: newNode.assignee, type: newNode.type },
        position: { x: Math.random() * 250, y: Math.random() * 150 },
      },
    ]);
    setNewNode({ title: "", assignee: "", type: "task" });
  };

  const handleAddEdge = () => {
    if (!newEdge.from || !newEdge.to) return;
    const id = crypto.randomUUID();
    setEdges((prev) => [...prev, { id, source: newEdge.from, target: newEdge.to }]);
    setNewEdge({ from: "", to: "" });
  };

  const saveWorkflow = async () => {
    if (!activeWorkflow) return;
    setLoading(true);
    try {
      const payload = {
        name: activeWorkflow.name,
        description: activeWorkflow.description,
        is_active: activeWorkflow.is_active === 1,
        nodes: nodes.map((n) => {
          const nodeData = (n.data || {}) as NodeData;
          return {
            id: n.id,
            node_key: n.id,
            title: nodeData.label || "",
            description: nodeData.description || "",
            type: nodeData.type || "task",
            assignee_role: nodeData.assignee || null,
            ui_position: n.position,
          };
        }),
        edges: edges.map((e) => ({
          id: e.id,
          from_node_id: e.source,
          to_node_id: e.target,
        })),
      };
      const res = await fetch(`/api/workflows/${activeWorkflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setActiveWorkflow(data.workflow || data);
      setError(null);
      await loadWorkflows();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Save failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    if (!createForm.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createForm.name, description: createForm.description }),
      });
      if (!res.ok) throw new Error("Failed to create workflow");
      const data = await res.json();
      setWorkflows((prev) => [data, ...prev]);
      selectWorkflow(data);
      setCreateForm({ name: "", description: "" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create workflow";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const submitIntake = async () => {
    if (!activeWorkflow) return;
    try {
      const payload = JSON.parse(intakePayload || "{}");
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_id: activeWorkflow.id, payload }),
      });
      if (!res.ok) throw new Error("Failed to submit intake");
      const data = await res.json();
      setIntakeStatus(data);
      setError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit intake";
      setError(message);
    }
  };

  const approveIntake = async () => {
    if (!intakeStatus?.id) return;
    try {
      const res = await fetch(`/api/intake/${intakeStatus.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) throw new Error("Approval failed");
      const data = await res.json();
      setIntakeStatus({ id: intakeStatus.id, status: data.status });
      setError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Approval failed";
      setError(message);
    }
  };

  const workflowOptions = useMemo(() => workflows.map((wf) => ({ value: wf.id, label: wf.name })), [workflows]);

  if (status === "loading") return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="p-6 space-y-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Studio</h1>
          <p className="text-sm text-zinc-400">Design dependency graphs and submit to Steve for planning.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs uppercase border border-white/20 px-3 py-2 rounded hover:border-white"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 space-y-3">
          <h2 className="text-sm uppercase text-zinc-400">Workflows</h2>
          <select
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded"
            value={activeWorkflow?.id || ""}
            onChange={(e) => {
              const wf = workflows.find((w) => w.id === e.target.value);
              if (wf) selectWorkflow(wf);
            }}
          >
            {workflowOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="border-t border-slate-800 pt-3 space-y-2">
            <input
              className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm"
              placeholder="New workflow name"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            />
            <textarea
              className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm"
              placeholder="Description"
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            />
            <button
              onClick={createWorkflow}
              className="w-full bg-white text-black rounded py-2 text-sm font-bold uppercase disabled:opacity-50"
              disabled={!createForm.name.trim() || loading}
            >
              Create Workflow
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 space-y-3">
          <h2 className="text-sm uppercase text-zinc-400">Add Node</h2>
          <input
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm"
            placeholder="Title"
            value={newNode.title}
            onChange={(e) => setNewNode((n) => ({ ...n, title: e.target.value }))}
          />
          <input
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm"
            placeholder="Assignee role"
            value={newNode.assignee}
            onChange={(e) => setNewNode((n) => ({ ...n, assignee: e.target.value }))}
          />
          <select
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm"
            value={newNode.type}
            onChange={(e) => setNewNode((n) => ({ ...n, type: e.target.value }))}
          >
            <option value="task">Task</option>
            <option value="decision">Decision</option>
            <option value="start">Start</option>
            <option value="end">End</option>
          </select>
          <button
            onClick={handleAddNode}
            className="w-full bg-white text-black rounded py-2 text-sm font-bold uppercase"
          >
            Add Node
          </button>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h3 className="text-sm uppercase text-zinc-400">Add Edge</h3>
            <select
              className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm"
              value={newEdge.from}
              onChange={(e) => setNewEdge((e2) => ({ ...e2, from: e.target.value }))}
            >
              <option value="">From node</option>
              {nodes.map((n) => <option key={n.id} value={n.id}>{n.data?.label}</option>)}
            </select>
            <select
              className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm"
              value={newEdge.to}
              onChange={(e) => setNewEdge((e2) => ({ ...e2, to: e.target.value }))}
            >
              <option value="">To node</option>
              {nodes.map((n) => <option key={n.id} value={n.id}>{n.data?.label}</option>)}
            </select>
            <button
              onClick={handleAddEdge}
              className="w-full bg-white text-black rounded py-2 text-sm font-bold uppercase"
            >
              Add Edge
            </button>
          </div>

          <button
            onClick={saveWorkflow}
            className="w-full bg-emerald-500 text-black rounded py-2 text-sm font-bold uppercase mt-4 disabled:opacity-50"
            disabled={!activeWorkflow || loading}
          >
            Save Workflow
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 space-y-3">
          <h2 className="text-sm uppercase text-zinc-400">Submit to Steve</h2>
          <textarea
            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm h-48"
            value={intakePayload}
            onChange={(e) => setIntakePayload(e.target.value)}
          />
          <button
            onClick={submitIntake}
            className="w-full bg-white text-black rounded py-2 text-sm font-bold uppercase"
            disabled={!activeWorkflow}
          >
            Submit Intake
          </button>
          {intakeStatus && (
            <div className="text-xs text-zinc-300 space-y-2 border border-slate-800 p-2 rounded">
              <div>ID: {intakeStatus.id}</div>
              <div>Status: {intakeStatus.status}</div>
              <button
                onClick={approveIntake}
                className="bg-emerald-500 text-black px-2 py-1 rounded text-xs font-bold"
              >
                Approve & Generate Tasks
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded h-[600px] p-2">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
