import { useState, useEffect } from "react";

export interface Task {
    id: string;
    title: string;
    description?: string;
    assignedAgent?: string;
    status: string;
    tags?: string[];
    securityFlagged?: boolean;
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
}

export function useDashboardData() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const updateTaskStatus = async (id: string, newStatus: string) => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );

        try {
            const response = await fetch("/api/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            // Background re-fetch to ensure consistency
            fetchTasks();
        } catch (e: any) {
            console.error("Failed to update task status:", e);
            // Revert optimism on error would happen here, or simple alert
            alert(`Error: ${e.message}`);
            fetchTasks(); // Revert to server state
        }
    };

    const createTask = async (taskData: any) => {
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(taskData),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await fetchTasks();
        } catch (e: any) {
            console.error("Failed to create task:", e);
            alert(`Error: ${e.message}`);
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
                }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await fetchAgents();
        } catch (e: any) {
            console.error("Failed to update agent:", e);
            alert(`Error: ${e.message}`);
        }
    }

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchTasks(), fetchAgents()]);
            setLoading(false);
        };
        init();
    }, []);

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
