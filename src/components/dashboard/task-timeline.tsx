"use client";

import { useEffect, useState } from "react";

type TaskEvent = {
  id: string;
  type: string;
  actor?: string | null;
  detail?: unknown;
  created_at?: string;
};

const TYPE_LABEL: Record<string, string> = {
  status_change: "Status",
  qa_approval: "QA",
  question: "Question",
  answer: "Answer",
  token_update: "Tokens",
  deploy: "Deploy",
  comment: "Comment",
};

export function TaskTimeline({ taskId }: { taskId: string }) {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/events`);
        if (!res.ok) throw new Error("Failed to load events");
        const data: TaskEvent[] = await res.json();
        setEvents(data);
        setError(null);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load events";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  if (loading) return <p className="text-xs text-zinc-500">Loading timeline...</p>;
  if (error) return <p className="text-xs text-red-400">{error}</p>;

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {events.length === 0 && <p className="text-xs text-zinc-500">No events yet.</p>}
      {events.map((evt) => (
        <div key={evt.id} className="border border-slate-800 rounded p-3 bg-slate-900">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono rounded bg-slate-800 text-zinc-300">
              {TYPE_LABEL[evt.type] || evt.type}
            </span>
            <span className="text-[10px] text-zinc-500">{evt.created_at}</span>
          </div>
          <div className="text-sm text-white/90">
            {evt.detail ? JSON.stringify(evt.detail) : 'No detail'}
          </div>
          {evt.actor && <div className="text-[10px] text-zinc-500 mt-1">Actor: {evt.actor}</div>}
        </div>
      ))}
    </div>
  );
}
