import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="py-24">
      <Badge variant="outline" className="mb-4 border-white/20 text-white/60 font-mono tracking-widest">
        AGENT 001 — READY
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
    </section>
  );
}
