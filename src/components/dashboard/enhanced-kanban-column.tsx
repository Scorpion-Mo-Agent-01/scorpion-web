"use client";

import { EnhancedTaskCard } from "./enhanced-task-card";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignedAgent?: string;
  status: string;
  tags?: string[];
  securityFlagged?: boolean;
}

interface EnhancedKanbanColumnProps {
  title: string;
  tasks: Task[];
  onStatusChange?: (id: string, newStatus: string) => void;
  onTaskClick?: (task: Task) => void;
}

export function EnhancedKanbanColumn({
  title,
  tasks,
  onStatusChange,
  onTaskClick,
}: EnhancedKanbanColumnProps) {
  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">
          {title}
        </h2>
        <span className="px-2 py-1 bg-slate-800 text-zinc-400 rounded-full text-xs font-mono">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-600 text-sm italic">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <EnhancedTaskCard
              key={task.id}
              {...task}
              onStatusChange={onStatusChange}
              onClick={() => onTaskClick?.(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}
