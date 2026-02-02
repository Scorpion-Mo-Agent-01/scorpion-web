"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface GlobalHeaderProps {
  agentsActive: number;
  tasksInQueue: number;
  completionRate: number;
  shieldStatus: "online" | "threat";
}

export function GlobalHeader({
  agentsActive,
  tasksInQueue,
  completionRate,
  shieldStatus,
}: GlobalHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const utcTime = format(currentTime, "HH:mm");
  const localTime = format(currentTime, "HH:mm zzz");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center text-black">
            <span className="text-2xl">🦂</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider uppercase">Obsidian Control</h1>
            <p className="text-xs text-zinc-500 font-mono">Multi-Agent Command Center</p>
          </div>
        </div>

        {/* Center: Stats Dashboard */}
        <div className="flex items-center gap-12">
          <Stat label="Agents Active" value={agentsActive} />
          <Stat label="Tasks in Queue" value={tasksInQueue} />
          <Stat label="Completion Rate" value={`${completionRate}%`} />
        </div>

        {/* Right: Clock & Shield */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-sm text-zinc-400">
              UTC {utcTime}
            </div>
            <div className="font-mono text-xs text-zinc-600">
              {localTime}
            </div>
          </div>
          <ShieldStatus status={shieldStatus} />
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-serif font-bold text-white mb-1">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function ShieldStatus({ status }: { status: "online" | "threat" }) {
  const isOnline = status === "online";

  return (
    <div
      className={`
        px-4 py-2 rounded-full font-mono text-xs font-bold uppercase
        flex items-center gap-2
        ${
          isOnline
            ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
            : "bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse"
        }
      `}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? "bg-emerald-500" : "bg-red-500 animate-ping"
        }`}
      />
      {isOnline ? "Online" : "Threat Detected"}
    </div>
  );
}
