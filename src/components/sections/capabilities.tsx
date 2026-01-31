export function Capabilities() {
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
      <div className="grid md:grid-cols-3 gap-12">
        {items.map((item, i) => (
          <div key={i} className="space-y-4">
            <h3 className="text-xl font-bold font-mono italic">{item.title}</h3>
            <p className="text-white/60 leading-relaxed text-sm">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
