"use client";

import React, { useRef, useState } from "react";
import { 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Users, 
  Database, 
  Container 
} from "lucide-react";

export function Capabilities() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const items = [
    {
      title: "CROSS-PLATFORM RELAY",
      desc: "Ubiquitous presence. Move between Signal, Telegram, and Discord without losing state. Your AI follows the conversation wherever you are.",
      icon: Zap
    },
    {
      title: "LOCAL-FIRST EXECUTION",
      desc: "Runs on your hardware. Full filesystem access, native tool execution, and local vector memory ensure absolute privacy and zero latency.",
      icon: ShieldCheck
    },
    {
      title: "MULTI-MODEL ORCHESTRATION",
      desc: "Seamless switching between Gemini, Claude, and specialized local models. Optimized for reasoning, speed, or cost depending on the task.",
      icon: Cpu
    },
    {
      title: "AUTONOMOUS SUB-AGENTS",
      desc: "Delegation without babysitting. Scorpion can spawn isolated workers for long-running research, deployments, or complex automation.",
      icon: Users
    },
    {
      title: "DURABLE MEMORY STORE",
      desc: "Local SQLite-based vector store for long-term project memory. Recalls past decisions, technical hurdles, and human preferences instantly.",
      icon: Database
    },
    {
      title: "DOCKERIZED ISOLATION",
      desc: "Every execution is sandboxed. Secure environment management for running untrusted code or complex multi-container systems.",
      icon: Container
    }
  ];

  return (
    <section id="capabilities" className="py-24 border-t border-white/10">
      <h2 className="text-sm font-mono text-white/40 mb-12 tracking-[0.3em]">SYSTEM CAPABILITIES</h2>
      
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setOpacity(1)}
        onMouseLeave={() => setOpacity(0)}
        className="grid md:grid-cols-3 gap-px bg-white/10 relative overflow-hidden border border-white/10"
      >
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
          style={{
            opacity,
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.4), transparent 80%)`,
          }}
        />

        {items.map((item, i) => (
          <div key={i} className="relative p-10 bg-black group/card z-10">
            <SpotlightBackground x={mousePosition.x} y={mousePosition.y} />

            <div className="relative space-y-6 z-10">
              <div className="w-12 h-12 flex items-center justify-center border border-white/10 bg-white/5 rounded-sm group-hover/card:border-white/30 transition-colors">
                <item.icon className="w-6 h-6 text-white/70 group-hover/card:text-white" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-mono italic text-white/90">{item.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm group-hover/card:text-white/70 transition-colors">
                  {item.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SpotlightBackground({ x, y }: { x: number, y: number }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (divRef.current && divRef.current.parentElement) {
      const parent = divRef.current.parentElement;
      const container = parent.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        setOffset({
          x: parentRect.left - containerRect.left,
          y: parentRect.top - containerRect.top
        });
      }
    }
  }, []);

  return (
    <div
      ref={divRef}
      className="pointer-events-none absolute -inset-px opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-0"
      style={{
        background: `radial-gradient(600px circle at ${x - offset.x}px ${y - offset.y}px, rgba(255,255,255,0.1), transparent 40%)`,
      }}
    />
  );
}
