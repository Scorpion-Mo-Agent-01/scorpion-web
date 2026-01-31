"use client";

import React, { useRef, useState } from "react";

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
      desc: "Ubiquitous presence. Move between Signal, Telegram, and Discord without losing state. Your AI follows the conversation wherever you are."
    },
    {
      title: "LOCAL-FIRST EXECUTION",
      desc: "Runs on your hardware. Full filesystem access, native tool execution, and local vector memory ensure absolute privacy and zero latency."
    },
    {
      title: "MULTI-MODEL ORCHESTRATION",
      desc: "Seamless switching between Gemini, Claude, and specialized local models. Optimized for reasoning, speed, or cost depending on the task."
    },
    {
      title: "AUTONOMOUS SUB-AGENTS",
      desc: "Delegation without babysitting. Scorpion can spawn isolated workers for long-running research, deployments, or complex automation."
    },
    {
      title: "DURABLE MEMORY STORE",
      desc: "Local SQLite-based vector store for long-term project memory. Recalls past decisions, technical hurdles, and human preferences instantly."
    },
    {
      title: "DOCKERIZED ISOLATION",
      desc: "Every execution is sandboxed. Secure environment management for running untrusted code or complex multi-container systems."
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
        {/* The shared Flashlight layer for borders */}
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
          style={{
            opacity,
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.4), transparent 80%)`,
          }}
        />

        {items.map((item, i) => (
          <div key={i} className="relative p-10 bg-black group/card z-10">
            {/* The Flashlight layer for card surface */}
            <div
              className="pointer-events-none absolute -inset-px opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-0"
              style={{
                background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`,
                // Trick to align gradient with container
                // We need to offset the gradient by the card's position relative to container
                // But since we are using 'calc' and 'var', it's better to just use a child div that is large.
              }}
            />
            
            {/* Standard "flashlight" that overflows is best done by letting the card's own gradient 
                offset itself by the card's position. We can use a simple hook for this. */}
            <SpotlightBackground x={mousePosition.x} y={mousePosition.y} />

            <div className="relative space-y-4 z-10">
              <h3 className="text-xl font-bold font-mono italic text-white/90">{item.title}</h3>
              <p className="text-white/50 leading-relaxed text-sm group-hover/card:text-white/70 transition-colors">
                {item.desc}
              </p>
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
