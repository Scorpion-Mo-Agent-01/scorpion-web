import { useState, useEffect, useCallback } from "react";
import { useSocket, WebSocketMessage } from "./use-socket";

export interface Task {
    id: string;
    title: string;
    description?: string;
    assignedAgent?: string;
    status: string;
    tags?: string[];
    securityFlagged?: boolean;
    qaApproved?: boolean;
    inputTokens?: number;
    outputTokens?: number;
    project?: string;
    // Compact summary for handoff context
    summary?: string;
}

export interface Agent {
    id: string;
    name: string;
    emoji: string;
    level: string;
    role: string;
    status: "WORKING" | "IDLE" | "BLOCKED";
    currentTask: string | null;
    skills: string[];
    system_prompt?: string | null;
    memory_cloud?: string | null;
}

export type TaskInput = Pick<Task, "title" | "description" | "assignedAgent" | "tags"> & { project?: string };

export function useDashboardData(token?: string, project: string = "default") {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const resolvedGatewayUrl = (() => {
        if (process.env.NEXT_PUBLIC_GATEWAY_WS && process.env.NEXT_PUBLIC_GATEWAY_WS.trim().length > 0) {
            return process.env.NEXT_PUBLIC_GATEWAY_WS;
        }
        if (typeof window === "undefined") {
            return "ws://localhost:8080";
        }
        const host = window.location.host; // e.g., localhost:3000 or 3.129.45.10:3000
        const gatewayHost = host.replace(/:3000$/, ":8080");
        return `ws://${gatewayHost}`;
    })();

    // Establish WebSocket connection, passing the token
    const { sendMessage } = useSocket(resolvedGatewayUrl, token, useCallback((message: WebSocketMessage) => {
        if (message.type === "task:update") {
            const updatedTask = message.payload as Task;
            setTasks((prev) =>
                prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
            );
        }
        if (message.type === "agent:update") {
            const updatedAgent = message.payload as Agent;
            setAgents((prev) =>
                prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
            );
        }
    }, []));

    const fetchTasks = useCallback(async () => {
        try {
            const response = await fetch(`/api/tasks?project=${encodeURIComponent(project)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data: Task[] = await response.json();
            setTasks(data);
            setError(null);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error fetching tasks";
            setError(message);
            console.error("Failed to fetch tasks:", e);
        }
    }, [project]);

    const fetchAgents = useCallback(async () => {
        try {
            const response = await fetch("/api/agents");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data: Agent[] = await response.json();
            setAgents(data);
        } catch (e: unknown) {
            console.error("Failed to fetch agents:", e);
        }
    }, []);

    const updateTaskStatus = async (id: string, newStatus: string) => {
        const currentTask = tasks.find((t) => t.id === id);
        const isQA = currentTask?.assignedAgent === "john";
        const wantsDone = newStatus === "done";
        const qaApproved = wantsDone && isQA;

        if (wantsDone && !isQA) {
            alert("Only QA (John) can mark as done.");
            return;
        }

        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: newStatus, qaApproved: qaApproved ? true : t.qaApproved } : t))
        );

        try {
            const response = await fetch("/api/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus, qaApproved }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const updatedTask = await response.json() as Task;
            sendMessage({ type: "task:update", payload: updatedTask });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to update task status";
            console.error("Failed to update task status:", e);
            alert(`Error: ${message}`);
            fetchTasks();
        }
    };

    const createTask = async (taskData: TaskInput) => {
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...taskData, project }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const newTask = await response.json() as Task;
            sendMessage({ type: "task:update", payload: newTask });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to create task";
            console.error("Failed to create task:", e);
            alert(`Error: ${message}`);
        }
    };

    const updateAgent = async (agent: Agent) => {
        try {
            const response = await fetch("/api/agents", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: agent.id,
                    status: agent.status,
                    currentTask: agent.currentTask,
                    skills: agent.skills,
                    system_prompt: agent.system_prompt,
                    memory_cloud: agent.memory_cloud,
                }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const updatedAgent = await response.json() as Agent;
            setAgents((prev) => prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)));
            sendMessage({ type: "agent:update", payload: updatedAgent });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to update agent";
            console.error("Failed to update agent:", e);
            alert(`Error: ${message}`);
        }
    }

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchTasks(), fetchAgents()]);
            setLoading(false);
        };
        init();
    }, [project, fetchTasks, fetchAgents]);

    return {
        tasks,
        agents,
        loading,
        error,
        updateTaskStatus,
        setTasks,
        createTask,
        updateAgent,
        refreshTasks: fetchTasks,
        refreshAgents: fetchAgents
    };
}
