"use client";

import { TaskCard } from "./task-card";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignedAgent?: string;
  status: string;
}

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function KanbanColumn({
  title,
  tasks,
  onStatusChange,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-80 bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-3">
        {title}
        <span className="ml-2 text-sm text-zinc-500">({tasks.length})</span>
      </h2>
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {tasks.length === 0 ? (
          <p className="text-zinc-600 text-sm italic">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} {...task} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </div>
  );
}
