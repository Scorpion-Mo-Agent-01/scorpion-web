"use client";

import { motion } from "framer-motion";

interface EnhancedTaskCardProps {
  id: string;
  title: string;
  description?: string;
  assignedAgent?: string;
  status: string;
  tags?: string[];
  securityFlagged?: boolean;
  onStatusChange?: (id: string, newStatus: string) => void;
  onClick?: () => void;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  inbox: ["assigned"],
  assigned: ["in progress", "inbox"],
  "in progress": ["review", "assigned"],
  review: ["done", "in progress"],
  done: ["review"],
};

const AGENT_MAP: Record<string, { emoji: string; initials: string }> = {
  "scorpion": { emoji: "🦂", initials: "SC" },
  "steve-j": { emoji: "📋", initials: "SJ" },
  "walter": { emoji: "🏗️", initials: "WA" },
  "linus": { emoji: "⚙️", initials: "LI" },
  "john": { emoji: "🔍", initials: "JO" },
  "sly": { emoji: "🎨", initials: "SL" },
};

export function EnhancedTaskCard({
  id,
  title,
  description,
  assignedAgent,
  status,
  tags = [],
  securityFlagged = false,
  onStatusChange,
  onClick,
}: EnhancedTaskCardProps) {
  const availableTransitions = STATUS_TRANSITIONS[status] || [];
  const agentInfo = assignedAgent ? AGENT_MAP[assignedAgent] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      whileHover={{ translateY: -1 }}
      onClick={onClick}
      className={`
        bg-slate-800 rounded-md p-4 mb-3 cursor-pointer
        border transition-all
        ${
          securityFlagged
            ? "border-red-500"
            : "border-slate-700 hover:border-slate-600"
        }
        relative
      `}
    >
      {securityFlagged && (
        <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm rounded-md flex items-center justify-center">
          <div className="bg-slate-900 border border-red-500 rounded px-3 py-1 flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span className="text-xs font-bold text-red-500 uppercase">Security Intervention</span>
          </div>
        </div>
      )}

      <h3 className="text-base font-bold text-white mb-2 leading-tight line-clamp-2">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{description}</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-slate-700 text-zinc-400 rounded text-xs font-mono lowercase"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {agentInfo && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700 mb-2">
          <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs">
            {agentInfo.emoji}
          </div>
          <p className="text-xs text-zinc-400 capitalize">{assignedAgent?.replace('-', ' ')}</p>
        </div>
      )}

      {onStatusChange && availableTransitions.length > 0 && !securityFlagged && (
        <div className="pt-2 border-t border-slate-700">
          <div className="flex gap-1 flex-wrap">
            {availableTransitions.map((nextStatus) => (
              <button
                key={nextStatus}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(id, nextStatus);
                }}
                className="px-2 py-1 bg-slate-700 text-zinc-300 hover:bg-slate-600 transition-colors rounded text-xs font-mono uppercase"
              >
                {nextStatus}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
