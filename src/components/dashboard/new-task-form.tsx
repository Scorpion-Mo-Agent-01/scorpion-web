"use client";

import { useState } from "react";

interface NewTaskFormProps {
  onTaskCreated: () => void;
}

export function NewTaskForm({ onTaskCreated }: NewTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset form
      setTitle("");
      setDescription("");
      
      // Notify parent to refresh tasks
      onTaskCreated();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create task";
      setError(message);
      console.error("Failed to create task:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Create New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs uppercase text-zinc-400 mb-2">
            Task Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 p-3 font-mono text-sm text-zinc-50 focus:border-zinc-500 outline-none transition-colors rounded"
            placeholder="Enter task title..."
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase text-zinc-400 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 p-3 font-mono text-sm text-zinc-50 focus:border-zinc-500 outline-none transition-colors rounded min-h-[100px]"
            placeholder="Enter task description..."
            disabled={loading}
          />
        </div>
        {error && (
          <p className="text-red-500 font-mono text-xs uppercase">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-50 text-slate-950 font-mono text-sm py-3 uppercase font-bold hover:bg-zinc-200 transition-colors disabled:bg-zinc-700 disabled:text-zinc-500 rounded"
        >
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </div>
  );
}
