"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  level: string;
  role: string;
  status: "WORKING" | "IDLE" | "BLOCKED";
  currentTask: string | null;
  skills: string[];
}

interface AgentEditModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Agent) => void;
}

export function AgentEditModal({ agent, isOpen, onClose, onSave }: AgentEditModalProps) {
  const [formData, setFormData] = useState(agent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
            onClick={onClose}
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
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{agent.emoji}</span>
                    <h2 className="text-2xl font-bold text-white">Edit Agent: {agent.name}</h2>
                  </div>
                  <button
                    onClick={onClose}
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
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white focus:border-slate-500 outline-none"
                  >
                    <option value="WORKING">WORKING</option>
                    <option value="IDLE">IDLE</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Current Task
                  </label>
                  <textarea
                    value={formData.currentTask || ""}
                    onChange={(e) => setFormData({ ...formData, currentTask: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white focus:border-slate-500 outline-none min-h-[100px]"
                    placeholder="What is this agent currently working on?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Skills (comma-separated)
                  </label>
                  <textarea
                    value={formData.skills.join(", ")}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white focus:border-slate-500 outline-none min-h-[100px] font-mono text-sm"
                    placeholder="skill-1, skill-2, skill-3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-white text-slate-950 font-bold py-3 rounded hover:bg-zinc-200 transition-colors uppercase text-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
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
