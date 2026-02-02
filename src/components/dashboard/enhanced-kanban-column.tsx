"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
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
  status: string; // Add status prop to identify droppable area
  onStatusChange?: (id: string, newStatus: string) => void;
  onTaskClick?: (task: Task) => void;
}

export function EnhancedKanbanColumn({
  title,
  tasks,
  status,
  onStatusChange,
  onTaskClick,
}: EnhancedKanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

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
      <div ref={setNodeRef} className="flex-1 overflow-y-auto pr-1 min-h-[100px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
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
        </SortableContext>
      </div>
    </div>
  );
}
