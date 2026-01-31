import { Badge } from "@/components/ui/badge";
import { ScorpionIcon } from "@/components/scorpion-icon";

export function Hero() {
  return (
    <section className="py-24 flex flex-col md:flex-row justify-between items-center gap-12">
      <div className="flex-1">
        <Badge variant="outline" className="mb-4 border-white/20 text-white/60 font-mono tracking-widest uppercase">
          Agent 001 — Ready
        </Badge>
        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-8 leading-[0.8]">
          THE AGENT<br />
          IS IN THE<br />
          <span className="text-white/20">MACHINE.</span>
        </h1>
        <p className="text-xl md:text-2xl font-mono text-white/60 max-w-2xl">
          An open agent platform running on your infrastructure. Your assistant. Your rules. 
          Integrated into the chat apps you already use.
        </p>
      </div>
      <div className="relative group flex-1 flex justify-center md:justify-end">
        <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-1000" />
        <ScorpionIcon className="w-64 h-64 md:w-[28rem] md:h-[28rem] relative z-10 text-white animate-in fade-in zoom-in duration-1000 select-none pointer-events-none drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all duration-500" />
      </div>
    </section>
  );
}
