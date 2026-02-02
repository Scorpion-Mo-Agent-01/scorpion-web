"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket, WebSocketMessage } from "@/hooks/use-socket";

interface LiveFeedEvent {
  id: string;
  type: "mention" | "comment" | "activity" | "agent:log" | "system:status";
  agent: string;
  message: string;
  timestamp: string;
}

export function LiveFeed({ token }: { token?: string }) {
  const [events, setEvents] = useState<LiveFeedEvent[]>([
    {
      id: "init",
      type: "system:status",
      agent: "SYSTEM",
      message: token ? "Preparing live feed..." : "Waiting for auth token...",
      timestamp: new Date().toISOString(),
    }
  ]);

  const handleSocketMessage = (message: WebSocketMessage) => {
    if (message.type === "agent:log" || message.type === "system:status") {
      const payload = (message.payload ?? {}) as { agent?: string; message?: string };
      const newEvent: LiveFeedEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: message.type,
        agent: payload.agent || (message.type === "system:status" ? "SYSTEM" : "UNKNOWN"),
        message: payload.message || JSON.stringify(message.payload),
        timestamp: new Date().toISOString(),
      };
      setEvents(prev => [newEvent, ...prev].slice(0, 15));
    }
  };

  const resolvedGatewayUrl = (() => {
    if (process.env.NEXT_PUBLIC_GATEWAY_WS && process.env.NEXT_PUBLIC_GATEWAY_WS.trim().length > 0) {
      return process.env.NEXT_PUBLIC_GATEWAY_WS;
    }
    if (typeof window === "undefined") {
      return "ws://localhost:8080";
    }
    const host = window.location.host;
    const gatewayHost = host.replace(/:3000$/, ":8080");
    return `ws://${gatewayHost}`;
  })();

  // Connect to the control-gateway WebSocket server, passing token (wait until token exists)
  const { isConnected } = useSocket(resolvedGatewayUrl, token, handleSocketMessage);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex justify-between items-center">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-mono font-bold flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          Live Intelligence Feed
        </h2>
        <span className="text-[10px] font-mono text-zinc-600 uppercase">
          {isConnected ? 'Gate Online' : 'Gate Offline'}
        </span>
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
                <span className={`text-[10px] font-bold uppercase tracking-tight ${event.type === 'system:status' ? 'text-blue-400' : 'text-white/80'}`}>
                  {event.agent}
                </span>
              </div>
              <p className="text-sm text-zinc-400 font-mono leading-relaxed">
                {event.message}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        {events.length === 0 && (
          <p className="text-xs text-zinc-600 font-mono text-center mt-10">Waiting for intelligence stream...</p>
        )}
      </div>
    </div>
  );
}
