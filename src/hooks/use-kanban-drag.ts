import { useState } from "react";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Task } from "./use-dashboard-data";

export function useKanbanDrag(
    tasks: Task[],
    columns: { title: string; status: string }[],
    updateTaskStatus: (id: string, status: string) => void,
    setTasks: (tasks: Task[]) => void
) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find((t) => t.id === active.id);
        if (task) setActiveTask(task);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        // Dropped over a column (status change)
        if (columns.some((c) => c.status === overId)) {
            const newStatus = overId;
            if (activeTask.status !== newStatus) {
                // Optimistic update
                const updatedTasks = tasks.map((t) =>
                    t.id === activeId ? { ...t, status: newStatus } : t
                );
                setTasks(updatedTasks);
                await updateTaskStatus(activeId, newStatus);
            }
            return;
        }

        // Dropped over another task
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask) {
            const newStatus = overTask.status;
            if (activeTask.status !== newStatus) {
                // Optimistic update for status change
                const updatedTasks = tasks.map((t) =>
                    t.id === activeId ? { ...t, status: newStatus } : t
                );
                setTasks(updatedTasks);
                await updateTaskStatus(activeId, newStatus);
            }
        }
    };

    return {
        activeTask,
        handleDragStart,
        handleDragEnd
    };
}
