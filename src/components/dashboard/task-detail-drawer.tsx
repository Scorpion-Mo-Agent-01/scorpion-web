"use client";

import { Task } from "@/hooks/use-dashboard-data";
import { TaskQuestionsPanel } from "@/components/dashboard/task-questions-panel";
import { TaskTimeline } from "@/components/dashboard/task-timeline";

export function TaskDetailDrawer({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-xl h-full bg-slate-950 border-l border-slate-800 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-zinc-500">Task Detail</p>
            <h2 className="text-xl text-white font-bold">{task.title}</h2>
            <p className="text-xs text-zinc-500">Project: {task.project || 'default'}</p>
          </div>
          <button className="text-zinc-400 hover:text-white" onClick={onClose}>Close</button>
        </div>

        <div className="p-4 space-y-6">
          {task.description && (
            <div>
              <h3 className="text-sm uppercase text-zinc-500">Description</h3>
              <p className="text-sm text-white/90 leading-relaxed">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm uppercase text-zinc-500 mb-2">Questions</h3>
              <TaskQuestionsPanel taskId={task.id} />
            </div>
            <div>
              <h3 className="text-sm uppercase text-zinc-500 mb-2">Timeline</h3>
              <TaskTimeline taskId={task.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
