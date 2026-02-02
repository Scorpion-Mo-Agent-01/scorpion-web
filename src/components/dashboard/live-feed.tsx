"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveFeedEvent {
  id: string;
  type: "mention" | "comment" | "activity";
  agent: string;
  message: string;
  timestamp: string;
}

export function LiveFeed() {
  const [events, setEvents] = useState<LiveFeedEvent[]>([]);

  useEffect(() => {
    // Mock initial events
    setEvents([
      {
        id: "1",
        type: "activity",
        agent: "Scorpion",
        message: "System initialized and security shield online.",
        timestamp: new Date().toISOString(),
      },
      {
        id: "2",
        type: "mention",
        agent: "Linus",
        message: "@Sly I've finished the API routes for the dashboard components.",
        timestamp: new Date().toISOString(),
      }
    ]);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const agents = ["Scorpion", "Steve J.", "Walter", "Linus", "John", "Sly"];
      const messages = [
        "Reviewing latest architectural changes.",
        "Executing test suite for session management.",
        "Refining CSS variables for Deep Dark theme.",
        "Updating AGENTS.md for specialist roles.",
        "Memory sync completed across all nodes."
      ];
      
      const newEvent: LiveFeedEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: "activity",
        agent: agents[Math.floor(Math.random() * agents.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date().toISOString(),
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 15));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-mono font-bold flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Live Intelligence Feed
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="border-l-2 border-slate-700 pl-4 py-1"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-zinc-500">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-tight text-white/80">
                  {event.agent}
                </span>
              </div>
              <p className="text-sm text-zinc-400 font-mono leading-relaxed">
                {event.message}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
