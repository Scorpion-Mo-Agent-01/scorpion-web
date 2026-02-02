"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Skill {
  name: string;
  description: string;
  category: string;
  isAssigned?: boolean;
}

export function SkillLab() {
  const [skills] = useState<Skill[]>([
    { name: "skill-creator", description: "Create or update AgentSkills", category: "Core" },
    { name: "github", description: "Interact with GitHub using gh CLI", category: "Ops" },
    { name: "architecture-diagrams", description: "Create system architecture diagrams", category: "Design" },
    { name: "web_search", description: "Search the web using Brave API", category: "Utility" },
    { name: "browser", description: "Control web browser for UI testing", category: "Dev" },
    { name: "expo-cicd-workflows", description: "Manage EAS CI/CD pipelines", category: "Mobile" },
  ]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-mono font-bold">
          Skill Matrix Lab
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {skills.map((skill) => (
            <motion.div
              key={skill.name}
              whileHover={{ x: 2 }}
              className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                    {skill.category}
                  </span>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {skill.name}
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono line-clamp-1">
                  {skill.description}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-slate-800 group-hover:bg-emerald-500 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
