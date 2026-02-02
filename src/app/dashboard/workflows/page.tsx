"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  addEdge,
  Connection,
  Edge,
  Node,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { LoadingScreen, ErrorScreen } from "@/components/dashboard/dashboard-states";

const palette = [
  { type: "trigger", label: "Trigger", icon: "💬" },
  { type: "task", label: "Task", icon: "🛠️" },
  { type: "decision", label: "If", icon: "⚡" },
  { type: "http", label: "HTTP", icon: "🌐" },
  { type: "notify", label: "Notify", icon: "🔔" },
  { type: "end", label: "End", icon: "🏁" },
];

const nodeStyle = {
  background: "#111318",
  border: "1px solid #1f2430",
  borderRadius: 12,
  padding: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

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

function WorkflowContent() {
  const { status } = useSession();
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstance = useReactFlow();

  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowRecord | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [intakePayload, setIntakePayload] = useState("{\n  \"summary\": \"\"\n}");
  const [intakeStatus, setIntakeStatus] = useState<IntakeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const selectWorkflow = useCallback((wf: WorkflowRecord) => {
    setActiveWorkflow(wf);
    setSelectedNodeId(null);
    const rfNodes: Node<NodeData>[] = (wf.nodes || []).map((n) => ({
      id: n.id,
      data: { label: n.title, assignee: n.assignee_role ?? "", type: n.type ?? "task" },
      position: n.ui_position ? JSON.parse(n.ui_position) : { x: 100, y: 100 },
      type: "default",
      style: nodeStyle,
    }));
    const rfEdges: Edge[] = (wf.edges || []).map((e) => ({
      id: e.id,
      source: e.from_node_id,
      target: e.to_node_id,
    }));
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [setEdges, setNodes]);

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      if (!res.ok) throw new Error("Failed to load workflows");
      const data: WorkflowRecord[] = await res.json();
      setWorkflows(data);
      if (!activeWorkflow && data.length > 0) {
        selectWorkflow(data[0]);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load workflows";
      setError(message);
    }
  }, [activeWorkflow, selectWorkflow]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const handleConnect = (connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, id: crypto.randomUUID(), animated: false }, eds));
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const data = event.dataTransfer.getData("application/reactflow");
    if (!data) return;
    const payload = JSON.parse(data) as { type: string; label: string };
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds) return;
    const position = reactFlowInstance.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    const id = crypto.randomUUID();
    setNodes((nds) => nds.concat({
      id,
      data: { label: payload.label, type: payload.type },
      position,
      style: nodeStyle,
    }));
    setSelectedNodeId(id);
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
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);

  if (status === "loading") return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="h-[calc(100vh-64px)] bg-[#0b0b0f] text-white p-6 flex gap-4">
      <div className="w-72 shrink-0 bg-[#0f1117] border border-[#1f2430] rounded-xl p-4 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Workflow Studio</h1>
          <p className="text-xs text-zinc-400">Drag nodes onto the canvas and wire them up like n8n.</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs uppercase text-zinc-500">Workflows</h2>
          <select
            className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
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
          <input
            className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
            placeholder="New workflow name"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
            placeholder="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
          />
          <button
            onClick={createWorkflow}
            className="w-full bg-white text-black rounded py-2 text-sm font-bold uppercase disabled:opacity-50"
            disabled={!createForm.name.trim() || loading}
          >
            Create
          </button>
        </div>

        <div className="border-t border-[#1f2430] pt-3 space-y-2">
          <h3 className="text-xs uppercase text-zinc-500">Node Palette</h3>
          <div className="grid grid-cols-2 gap-2">
            {palette.map((item) => (
              <button
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type, item.label)}
                className="flex items-center gap-2 bg-[#111318] border border-[#1f2430] rounded-lg px-3 py-2 text-sm hover:border-[#2f3745]"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full text-xs uppercase border border-white/20 px-3 py-2 rounded hover:border-white"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="flex-1 bg-[#0f1117] border border-[#1f2430] rounded-xl overflow-hidden relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          fitView
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          proOptions={{ hideAttribution: true }}
        >
          <Controls position="bottom-left" />
          <Background color="#1f2430" gap={20} />
        </ReactFlow>
      </div>

      <div className="w-80 shrink-0 bg-[#0f1117] border border-[#1f2430] rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase text-zinc-500">Inspector</h2>
          <button
            onClick={saveWorkflow}
            className="text-xs px-3 py-1 rounded bg-emerald-500 text-black font-bold uppercase disabled:opacity-50"
            disabled={!activeWorkflow || loading}
          >
            Save
          </button>
        </div>

        {selectedNode ? (
          <div className="space-y-3">
            <input
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
              value={(selectedNode.data as NodeData).label || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as NodeData), label: value } } : n));
              }}
              placeholder="Node title"
            />
            <input
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
              value={(selectedNode.data as NodeData).assignee || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as NodeData), assignee: value } } : n));
              }}
              placeholder="Assignee role"
            />
            <select
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
              value={(selectedNode.data as NodeData).type || "task"}
              onChange={(e) => {
                const value = e.target.value;
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as NodeData), type: value } } : n));
              }}
            >
              <option value="trigger">Trigger</option>
              <option value="task">Task</option>
              <option value="decision">If</option>
              <option value="http">HTTP</option>
              <option value="notify">Notify</option>
              <option value="end">End</option>
            </select>
            <textarea
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm min-h-[100px]"
              value={(selectedNode.data as NodeData).description || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as NodeData), description: value } } : n));
              }}
              placeholder="Description / config"
            />
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Select a node to configure.</p>
        )}

        <div className="border-t border-[#1f2430] pt-3 space-y-2">
          <h3 className="text-xs uppercase text-zinc-500">Submit to Steve</h3>
          <textarea
            className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm h-36"
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
            <div className="text-xs text-zinc-300 space-y-2 border border-[#1f2430] p-2 rounded">
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
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <WorkflowContent />
    </ReactFlowProvider>
  );
}
