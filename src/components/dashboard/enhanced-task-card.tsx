"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

interface EnhancedTaskCardProps {
  id: string;
  title: string;
  description?: string;
  assignedAgent?: string;
  status: string;
  tags?: string[];
  securityFlagged?: boolean;
  qaApproved?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  onStatusChange?: (id: string, newStatus: string) => void;
  onClick?: () => void;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  inbox: ["assigned"],
  assigned: ["in progress", "inbox"],
  "in progress": ["review", "assigned"],
  review: ["in progress"], // QA will provide Done
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
  qaApproved = false,
  inputTokens,
  outputTokens,
  onStatusChange,
  onClick,
}: EnhancedTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  let availableTransitions = STATUS_TRANSITIONS[status] || [];
  // Only QA (john) can move to done
  if (status === "review" && assignedAgent === "john") {
    availableTransitions = ["done", ...availableTransitions];
  }
  const agentInfo = assignedAgent ? AGENT_MAP[assignedAgent] : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={false}
      whileHover={{ translateY: -1 }}
      onClick={onClick}
      className={`
        bg-slate-800 rounded-md p-4 mb-3 cursor-grab active:cursor-grabbing
        border transition-all
        ${securityFlagged
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
          {tags.length > 3 && (
            <span className="px-2 py-0.5 bg-slate-700 text-zinc-400 rounded text-xs font-mono lowercase">+{tags.length - 3}</span>
          )}
        </div>
      )}

      {agentInfo && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700 mb-2">
          <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs">
            {agentInfo.emoji}
          </div>
          <p className="text-xs text-zinc-400 capitalize">{assignedAgent?.replace('-', ' ')}</p>
          {status === "done" && qaApproved && (
            <span className="text-[10px] uppercase text-emerald-400 font-mono">QA approved</span>
          )}
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

      {(inputTokens !== undefined || outputTokens !== undefined) && (
        <div className="pt-2 border-t border-slate-700 mt-2 text-[11px] text-zinc-400 font-mono flex gap-3">
          {inputTokens !== undefined && <span>In: {inputTokens}</span>}
          {outputTokens !== undefined && <span>Out: {outputTokens}</span>}
        </div>
      )}
    </motion.div>
  );
}
