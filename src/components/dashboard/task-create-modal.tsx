"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description: string;
    assignedAgent?: string;
    tags: string[];
  }) => void;
  agents: Array<{ id: string; name: string; emoji: string }>;
}

export function TaskCreateModal({ isOpen, onClose, onSubmit, agents }: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      assignedAgent: assignedAgent || undefined,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });

    // Reset form
    setTitle("");
    setDescription("");
    setAssignedAgent("");
    setTags("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setAssignedAgent("");
    setTags("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Create New Task</h2>
                  <button
                    onClick={handleClose}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white focus:border-slate-500 outline-none"
                    placeholder="Enter task title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white focus:border-slate-500 outline-none min-h-[120px]"
                    placeholder="Describe the task requirements..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Assign to Agent
                  </label>
                  <select
                    value={assignedAgent}
                    onChange={(e) => setAssignedAgent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white focus:border-slate-500 outline-none"
                  >
                    <option value="">Unassigned (Inbox)</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.name}>
                        {agent.emoji} {agent.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 mt-2">
                    Tasks will start in Inbox unless assigned to an agent
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white focus:border-slate-500 outline-none font-mono text-sm"
                    placeholder="ui, backend, security"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Separate tags with commas
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500 rounded px-4 py-3">
                    <p className="text-red-500 text-sm font-bold">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-white text-slate-950 font-bold py-3 rounded hover:bg-zinc-200 transition-colors uppercase text-sm"
                  >
                    Create Task
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 bg-slate-800 text-white font-bold py-3 rounded hover:bg-slate-700 transition-colors uppercase text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
