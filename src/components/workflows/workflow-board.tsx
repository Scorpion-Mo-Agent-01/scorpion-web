"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeProps,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { LoadingScreen, ErrorScreen } from "@/components/dashboard/dashboard-states";

const STATUS_OPTIONS = [
  { value: "idle", label: "Idle" },
  { value: "working", label: "Working" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
] as const;

const ROLE_MAP: Record<string, string> = {
  plan: "steve-j",
  review: "steve-j",
  backend: "linus",
  ui: "sly",
  qa: "john",
  approval: "scorpion",
};

const NODE_PALETTE = [
  { type: "plan", label: "Plan", icon: "🧠" },
  { type: "backend", label: "Backend", icon: "⚙️" },
  { type: "ui", label: "UI", icon: "🎨" },
  { type: "review", label: "Review", icon: "🔎" },
  { type: "qa", label: "QA", icon: "✅" },
  { type: "approval", label: "Approval", icon: "🛡️" },
  { type: "custom", label: "Custom", icon: "✨" },
];

export type Agent = {
  id: string;
  name: string;
  emoji: string;
  role: string;
};

type WorkflowNodeData = {
  node_key: string;
  title: string;
  description?: string;
  type: string;
  assignee_role?: string;
  assignee_agent_id?: string;
  status: string;
  model_name?: string;
  input_tokens?: number;
  output_tokens?: number;
  skills_used?: string[];
  time_spent_ms?: number;
  context_summary?: string;
  telemetry?: Record<string, unknown> | null;
  order_index?: number | null;
  metadata?: Record<string, unknown> | null;
  ui_position?: { x: number; y: number } | null;
};

type WorkflowRecord = {
  id: string;
  name: string;
  description?: string | null;
  is_active?: number;
  nodes?: Array<WorkflowNodeData & { id: string }>;
  edges?: Array<{ id: string; from_node_id: string; to_node_id: string }>;
};

type NodeStatus = typeof STATUS_OPTIONS[number]["value"];

const statusColor = (status: NodeStatus) => {
  switch (status) {
    case "working":
      return "bg-amber-500/20 text-amber-200 border border-amber-500/50";
    case "blocked":
      return "bg-rose-500/15 text-rose-200 border border-rose-500/50";
    case "completed":
      return "bg-emerald-500/20 text-emerald-200 border border-emerald-500/50";
    default:
      return "bg-slate-700/50 text-slate-200 border border-slate-600";
  }
};

const minutesFromMs = (ms?: number) => Math.max(0, Math.round((ms || 0) / 60000));
const msFromMinutes = (mins: number) => Math.max(0, Math.round(mins * 60000));

const WorkflowNodeCard = ({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const chips = [
    data.assignee_role ? `${data.assignee_role}` : null,
    data.model_name ? `model: ${data.model_name}` : null,
    data.input_tokens || data.output_tokens ? `tokens: ${(data.input_tokens || 0) + (data.output_tokens || 0)}` : null,
  ].filter(Boolean);

  return (
    <div className={`min-w-[220px] max-w-[320px] rounded-xl border ${selected ? "border-emerald-400/70" : "border-[#1f2430]"} bg-gradient-to-br from-[#0f1117] to-[#0b0d12] text-white shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-4 transition-transform`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase text-zinc-500">{data.type}</div>
          <div className="font-semibold text-lg leading-tight">{data.title}</div>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full ${statusColor((data.status as NodeStatus) || "idle")}`}>
          {data.status || "idle"}
        </span>
      </div>
      {data.context_summary && (
        <p className="text-xs text-zinc-300 mt-2 line-clamp-2">{data.context_summary}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-3">
        {chips.map((chip) => (
          <span key={chip} className="text-[11px] px-2 py-1 rounded bg-white/5 border border-white/10">{chip}</span>
        ))}
        {minutesFromMs(data.time_spent_ms) > 0 && (
          <span className="text-[11px] px-2 py-1 rounded bg-white/5 border border-white/10">{minutesFromMs(data.time_spent_ms)}m</span>
        )}
      </div>
    </div>
  );
};

const nodeTypes = { workflow: WorkflowNodeCard };

function buildSuggestedChain(name: string, planInstruction: string) {
  const chain = ["plan", "backend", "ui", "review", "qa"];
  const nodes: Array<Node<WorkflowNodeData>> = [];
  const edges: Edge[] = [];
  const baseX = 120;
  const gapX = 220;
  chain.forEach((type, idx) => {
    const id = crypto.randomUUID();
    const description = idx === 0 ? planInstruction || `Plan for ${name}` : `Handle ${type} for ${name}`;
    nodes.push({
      id,
      position: { x: baseX + idx * gapX, y: 200 },
      data: {
        node_key: id,
        title: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
        description,
        type,
        assignee_role: ROLE_MAP[type] ? `${ROLE_MAP[type]} (auto)` : undefined,
        assignee_agent_id: ROLE_MAP[type],
        status: "idle",
        model_name: "gpt-4.1",
        input_tokens: 0,
        output_tokens: 0,
        skills_used: [],
        time_spent_ms: 0,
        context_summary: idx === 0 ? planInstruction : undefined,
        telemetry: { tool_calls: [] },
        order_index: idx,
      },
      type: "workflow",
    });
    if (idx > 0) {
      edges.push({ id: crypto.randomUUID(), source: nodes[idx - 1].id, target: id });
    }
  });
  return { nodes, edges };
}

function aggregateContextTrail(currentId: string, nodes: Node<WorkflowNodeData>[], edges: Edge[]) {
  const incoming = edges.filter((e) => e.target === currentId).map((e) => e.source);
  const visited = new Set<string>();
  const summaries: string[] = [];
  const dfs = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodes.find((n) => n.id === id);
    if (node?.data.context_summary) summaries.push(node.data.context_summary);
    edges.filter((e) => e.target === id).forEach((e) => dfs(e.source));
  };
  incoming.forEach((id) => dfs(id));
  return summaries.slice(0, 3);
}

export function WorkflowBoard() {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstance = useReactFlow();
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowRecord | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", description: "", planInstruction: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        if (res.ok) {
          const data = await res.json();
          setAgents(data as Agent[]);
        }
      } catch (err) {
        console.error("Failed to load agents", err);
      }
    };
    loadAgents();
  }, []);

  const selectWorkflow = (wf: WorkflowRecord | null) => {
    setActiveWorkflow(wf);
    setSelectedNodeId(null);
    if (!wf) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const nodeList: Array<WorkflowNodeData & { id: string }> = wf.nodes ?? [];
    const rfNodes: Node<WorkflowNodeData>[] = nodeList.map((n, idx) => {
      const position: { x: number; y: number } = n.ui_position ?? { x: 120 + idx * 200, y: 200 };
      return {
        id: n.id,
        data: {
          node_key: n.node_key || n.id,
          title: n.title,
          description: n.description || "",
          type: n.type || "task",
          assignee_role: n.assignee_role || undefined,
          assignee_agent_id: n.assignee_agent_id || undefined,
          status: (n.status as NodeStatus) || "idle",
          model_name: n.model_name || undefined,
          input_tokens: n.input_tokens ?? 0,
          output_tokens: n.output_tokens ?? 0,
          skills_used: n.skills_used || [],
          time_spent_ms: n.time_spent_ms ?? 0,
          context_summary: n.context_summary || "",
          telemetry: n.telemetry || null,
          order_index: n.order_index ?? idx,
          metadata: n.metadata || null,
          ui_position: position,
        },
        position,
        type: "workflow",
      };
    });
    const rfEdges: Edge[] = (wf.edges || []).map((e) => ({
      id: e.id,
      source: e.from_node_id,
      target: e.to_node_id,
    }));
    setNodes(rfNodes);
    setEdges(rfEdges);
  };

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/workflows");
      if (!res.ok) throw new Error("Failed to load workflows");
      const data: WorkflowRecord[] = await res.json();
      setWorkflows(data);
      if (!activeWorkflow && data.length > 0) {
        selectWorkflow(data[0]);
      } else if (activeWorkflow) {
        const refreshed = data.find((w) => w.id === activeWorkflow.id);
        selectWorkflow(refreshed || null);
      }
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load workflows";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      type: "workflow",
      position,
      data: {
        node_key: id,
        title: payload.label,
        type: payload.type,
        assignee_role: ROLE_MAP[payload.type] ? `${ROLE_MAP[payload.type]} (auto)` : undefined,
        assignee_agent_id: ROLE_MAP[payload.type],
        status: "idle",
        skills_used: [],
        input_tokens: 0,
        output_tokens: 0,
        time_spent_ms: 0,
        context_summary: "",
        telemetry: { tool_calls: [] },
        order_index: nds.length,
      },
    }));
    setSelectedNodeId(id);
  };

  const saveWorkflow = async () => {
    if (!activeWorkflow) return;
    setSaving(true);
    try {
      const payload = {
        name: activeWorkflow.name,
        description: activeWorkflow.description,
        is_active: activeWorkflow.is_active === 1,
        nodes: nodes.map((n, idx) => {
          const nodeData = n.data as WorkflowNodeData;
          return {
            id: n.id,
            node_key: nodeData.node_key || n.id,
            title: nodeData.title || "",
            description: nodeData.description || "",
            type: nodeData.type || "task",
            assignee_role: nodeData.assignee_role || null,
            assignee_agent_id: nodeData.assignee_agent_id || null,
            status: nodeData.status || "idle",
            model_name: nodeData.model_name || null,
            input_tokens: nodeData.input_tokens ?? 0,
            output_tokens: nodeData.output_tokens ?? 0,
            skills_used: nodeData.skills_used || [],
            time_spent_ms: nodeData.time_spent_ms ?? 0,
            context_summary: nodeData.context_summary || "",
            telemetry: nodeData.telemetry || null,
            order_index: nodeData.order_index ?? idx,
            metadata: nodeData.metadata || null,
            ui_position: n.position,
          } as WorkflowNodeData & { id: string };
        }),
        edges: edges.map((e) => ({ id: e.id, from_node_id: e.source, to_node_id: e.target })),
      };
      const res = await fetch(`/api/workflows/${activeWorkflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      await loadWorkflows();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const createWorkflow = async () => {
    if (!createForm.name.trim()) return;
    setSaving(true);
    try {
      const { nodes: suggestedNodes, edges: suggestedEdges } = buildSuggestedChain(createForm.name.trim(), createForm.planInstruction.trim());
      const payload = {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        nodes: suggestedNodes.map((n, idx) => ({
          id: n.id,
          node_key: n.data.node_key,
          title: n.data.title,
          description: n.data.description,
          type: n.data.type,
          assignee_role: n.data.assignee_role,
          assignee_agent_id: n.data.assignee_agent_id,
          status: n.data.status,
          model_name: n.data.model_name,
          input_tokens: n.data.input_tokens,
          output_tokens: n.data.output_tokens,
          skills_used: n.data.skills_used,
          time_spent_ms: n.data.time_spent_ms,
          context_summary: n.data.context_summary,
          telemetry: n.data.telemetry,
          order_index: n.data.order_index ?? idx,
          ui_position: n.position,
        })),
        edges: suggestedEdges.map((e) => ({ id: e.id, from_node_id: e.source, to_node_id: e.target })),
      };
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create workflow");
      await loadWorkflows();
      setCreateForm({ name: "", description: "", planInstruction: "" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create workflow";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);
  const contextTrail = useMemo(() => selectedNodeId ? aggregateContextTrail(selectedNodeId, nodes, edges) : [], [selectedNodeId, nodes, edges]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="h-[calc(100vh-64px)] bg-[#0b0b0f] text-white p-6 flex gap-4">
      <div className="w-72 shrink-0 bg-[#0f1117] border border-[#1f2430] rounded-xl p-4 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Workflow Graph</h1>
          <p className="text-xs text-zinc-400">Nodes are tasks with status, telemetry, and assignees.</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs uppercase text-zinc-500">Workflows</h2>
          <select
            className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
            value={activeWorkflow?.id || ""}
            onChange={(e) => {
              const wf = workflows.find((w) => w.id === e.target.value) || null;
              selectWorkflow(wf);
            }}
          >
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id}>{wf.name}</option>
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
          <textarea
            className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
            placeholder="Plan instruction (seed context)"
            value={createForm.planInstruction}
            onChange={(e) => setCreateForm((f) => ({ ...f, planInstruction: e.target.value }))}
          />
          <button
            onClick={createWorkflow}
            className="w-full bg-white text-black rounded py-2 text-sm font-bold uppercase disabled:opacity-50"
            disabled={!createForm.name.trim() || saving}
          >
            Create with chain
          </button>
        </div>

        <div className="border-t border-[#1f2430] pt-3 space-y-2">
          <h3 className="text-xs uppercase text-zinc-500">Node Palette</h3>
          <div className="grid grid-cols-2 gap-2">
            {NODE_PALETTE.map((item) => (
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
      </div>

      <div className="flex-1 bg-[#0f1117] border border-[#1f2430] rounded-xl overflow-hidden relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          fitView
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable
          elementsSelectable
        >
          <Controls position="bottom-left" />
          <Background color="#1f2430" gap={24} />
        </ReactFlow>
      </div>

      <div className="w-96 shrink-0 bg-[#0f1117] border border-[#1f2430] rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase text-zinc-500">Inspector</h2>
          <button
            onClick={saveWorkflow}
            className="text-xs px-3 py-1 rounded bg-emerald-500 text-black font-bold uppercase disabled:opacity-50"
            disabled={!activeWorkflow || saving}
          >
            Save
          </button>
        </div>

        {selectedNode ? (
          <div className="space-y-3">
            <input
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
              value={(selectedNode.data as WorkflowNodeData).title || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), title: value } } : n));
              }}
              placeholder="Node title"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
                value={(selectedNode.data as WorkflowNodeData).type || "task"}
                onChange={(e) => {
                  const value = e.target.value;
                  setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), type: value } } : n));
                }}
              >
                {NODE_PALETTE.map((p) => <option key={p.type} value={p.type}>{p.label}</option>)}
              </select>
              <select
                className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
                value={(selectedNode.data as WorkflowNodeData).status || "idle"}
                onChange={(e) => {
                  const value = e.target.value as NodeStatus;
                  setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), status: value } } : n));
                }}
              >
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <select
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
              value={(selectedNode.data as WorkflowNodeData).assignee_agent_id || ""}
              onChange={(e) => {
                const value = e.target.value;
                const selectedAgent = agents.find((a) => a.id === value);
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? {
                  ...n,
                  data: {
                    ...(n.data as WorkflowNodeData),
                    assignee_agent_id: value || undefined,
                    assignee_role: selectedAgent ? `${selectedAgent.name} (${selectedAgent.role})` : value,
                  }
                } : n));
              }}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.emoji} {a.name} — {a.role}</option>
              ))}
            </select>
            <textarea
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm min-h-[80px]"
              value={(selectedNode.data as WorkflowNodeData).description || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), description: value } } : n));
              }}
              placeholder="Instruction / details"
            />
            <textarea
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm min-h-[80px]"
              value={(selectedNode.data as WorkflowNodeData).context_summary || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), context_summary: value } } : n));
              }}
              placeholder="Context summary for next node(s)"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
                placeholder="Model"
                value={(selectedNode.data as WorkflowNodeData).model_name || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), model_name: value } } : n));
                }}
              />
              <input
                type="number"
                className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
                placeholder="Minutes"
                value={minutesFromMs((selectedNode.data as WorkflowNodeData).time_spent_ms)}
                onChange={(e) => {
                  const mins = Number(e.target.value) || 0;
                  setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), time_spent_ms: msFromMinutes(mins) } } : n));
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
                placeholder="Input tokens"
                value={(selectedNode.data as WorkflowNodeData).input_tokens ?? 0}
                onChange={(e) => {
                  const value = Number(e.target.value) || 0;
                  setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), input_tokens: value } } : n));
                }}
              />
              <input
                type="number"
                className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
                placeholder="Output tokens"
                value={(selectedNode.data as WorkflowNodeData).output_tokens ?? 0}
                onChange={(e) => {
                  const value = Number(e.target.value) || 0;
                  setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), output_tokens: value } } : n));
                }}
              />
            </div>
            <input
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm"
              placeholder="Skills used (comma separated)"
              value={(selectedNode.data as WorkflowNodeData).skills_used?.join(", ") || ""}
              onChange={(e) => {
                const value = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), skills_used: value } } : n));
              }}
            />
            <textarea
              className="w-full bg-[#0b0d12] border border-[#1f2430] p-2 rounded text-sm min-h-[60px]"
              placeholder="Tool calls / telemetry notes"
              value={typeof (selectedNode.data as WorkflowNodeData).telemetry?.notes === "string" ? String((selectedNode.data as WorkflowNodeData).telemetry?.notes) : ""}
              onChange={(e) => {
                const value = e.target.value;
                setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as WorkflowNodeData), telemetry: { ...(n.data as WorkflowNodeData).telemetry, notes: value } } } : n));
              }}
            />
            {contextTrail.length > 0 && (
              <div className="bg-[#0b0d12] border border-[#1f2430] rounded p-2 text-xs text-zinc-300 space-y-1">
                <div className="font-semibold text-zinc-200">Incoming context</div>
                {contextTrail.map((ctx, idx) => (
                  <div key={idx} className="line-clamp-2">• {ctx}</div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Select a node to configure.</p>
        )}
      </div>
    </div>
  );
}

export function WorkflowBoardWithProvider() {
  return (
    <ReactFlowProvider>
      <WorkflowBoard />
    </ReactFlowProvider>
  );
}
