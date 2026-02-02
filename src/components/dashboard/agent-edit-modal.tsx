"use client";

import { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"status" | "profile">("status");
  const [docs, setDocs] = useState<{ agentsMd: string; soulMd: string } | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Reset form when agent changes
  useEffect(() => {
    setFormData(agent);
    setActiveTab("status");
    setDocs(null); // Clear old docs
  }, [agent]);

  // Fetch docs when switching to Profile tab
  useEffect(() => {
    if (activeTab === "profile" && !docs && isOpen) {
      setLoadingDocs(true);
      fetch(`/api/agents/${agent.id}/docs`)
        .then(res => res.json())
        .then(data => {
          setDocs(data);
          setLoadingDocs(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingDocs(false);
        });
    }
  }, [activeTab, agent.id, docs, isOpen]);


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
            <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex-shrink-0 bg-slate-900 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{agent.emoji}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">{agent.name}</h2>
                      <span className="text-zinc-400 text-sm font-mono uppercase tracking-wider">{agent.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-6 border-b border-slate-800/50">
                  <TabButton active={activeTab === "status"} onClick={() => setActiveTab("status")} label="Status & Tasks" />
                  <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} label="Agent Profile" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {activeTab === "status" ? (
                  <StatusForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} onClose={onClose} />
                ) : (
                  <ProfileView loading={loadingDocs} docs={docs} />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
        }`}
    >
      {label}
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
        />
      )}
    </button>
  );
}

function StatusForm({ formData, setFormData, handleSubmit, onClose }: any) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-1">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Current Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white focus:border-slate-500 outline-none appearance-none font-mono"
          >
            <option value="WORKING">WORKING</option>
            <option value="IDLE">IDLE</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          Current Objective
        </label>
        <textarea
          value={formData.currentTask || ""}
          onChange={(e) => setFormData({ ...formData, currentTask: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white focus:border-slate-500 outline-none min-h-[120px] font-sans"
          placeholder="What is this agent currently working on?"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          Active Skills
        </label>
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <textarea
            value={formData.skills.join(", ")}
            onChange={(e) => setFormData({
              ...formData,
              skills: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
            })}
            className="w-full bg-transparent text-zinc-300 outline-none min-h-[80px] font-mono text-xs"
            placeholder="skill-1, skill-2"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.skills.map((skill: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-slate-700 text-zinc-300 rounded text-xs font-mono">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-slate-800">
        <button
          type="submit"
          className="flex-1 bg-white text-slate-950 font-bold py-3 rounded hover:bg-zinc-200 transition-colors uppercase text-xs tracking-widest"
        >
          Confirm Updates
        </button>
      </div>
    </form>
  );
}

function ProfileView({ loading, docs }: { loading: boolean; docs: { agentsMd: string; soulMd: string } | null }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-4xl">🦂</div>
      </div>
    );
  }

  if (!docs) return null;

  return (
    <div className="grid grid-cols-2 gap-8 h-full">
      <div className="space-y-4">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest sticky top-0 bg-slate-900 pb-2">Identify File (AGENTS.md)</h3>
        <MarkdownRenderer content={docs.agentsMd} />
      </div>
      <div className="space-y-4">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest sticky top-0 bg-slate-900 pb-2">Soul Matrix (SOUL.md)</h3>
        <MarkdownRenderer content={docs.soulMd} />
      </div>
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  // Very basic regex-based renderer for headers and lists to look nice
  // In a real app, use react-markdown

  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-zinc-300 text-sm leading-relaxed font-sans">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-white mt-6 mb-3 border-b border-slate-700 pb-2">{line.replace('# ', '')}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-white mt-5 mb-2">{line.replace('## ', '')}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-zinc-200 mt-4 mb-2">{line.replace('### ', '')}</h3>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-zinc-400">{line.replace('- ', '')}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
