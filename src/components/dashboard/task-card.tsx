"use client";

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  assignedAgent?: string;
  status: string;
  onStatusChange?: (id: string, newStatus: string) => void;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  inbox: ["assigned"],
  assigned: ["in progress", "inbox"],
  "in progress": ["review", "assigned"],
  review: ["done", "in progress"],
  done: ["review"],
};

export function TaskCard({
  id,
  title,
  description,
  assignedAgent,
  status,
  onStatusChange,
}: TaskCardProps) {
  const availableTransitions = STATUS_TRANSITIONS[status] || [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-md p-4 mb-4 shadow-lg">
      <h3 className="text-lg font-bold text-zinc-50 mb-2">{title}</h3>
      {description && <p className="text-zinc-400 text-sm mb-2">{description}</p>}
      {assignedAgent && (
        <p className="text-zinc-500 text-xs mt-2">
          Assigned: <span className="font-mono text-zinc-300">{assignedAgent}</span>
        </p>
      )}
      <p className="text-zinc-500 text-xs mt-1">
        Status: <span className="font-mono text-zinc-300 capitalize">{status}</span>
      </p>
      
      {onStatusChange && availableTransitions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-zinc-500 text-xs mb-2">Move to:</p>
          <div className="flex gap-2 flex-wrap">
            {availableTransitions.map((nextStatus) => (
              <button
                key={nextStatus}
                onClick={() => onStatusChange(id, nextStatus)}
                className="px-3 py-1 bg-slate-700 text-zinc-300 hover:bg-slate-600 transition-colors rounded text-xs font-mono uppercase"
              >
                {nextStatus}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
