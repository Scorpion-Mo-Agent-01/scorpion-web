import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Capabilities } from "@/components/sections/capabilities";
import { ScorpionIcon } from "@/components/scorpion-icon";
import { AuthInterface } from "@/components/auth-interface";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center text-black">
            <ScorpionIcon className="w-5 h-5" />
          </div>
          <span className="font-mono tracking-widest text-lg font-bold uppercase">Scorpion</span>
        </div>
        <div className="flex gap-8 text-sm font-mono text-white/60">
          <a href="#about" className="hover:text-white transition-colors">ABOUT</a>
          <a href="#capabilities" className="hover:text-white transition-colors">CAPABILITIES</a>
          <a href="#control" className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors rounded-sm font-bold">LOGIN</a>
        </div>
      </nav>

      <main className="pt-32 px-8 max-w-6xl mx-auto">
        <Hero />
        
        <section id="control" className="py-24 border-t border-white/10 flex flex-col items-center justify-center text-center gap-12 min-h-[60vh]">
          <div className="max-w-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 uppercase">Command Center</h2>
            <p className="font-mono text-white/40 uppercase tracking-[0.2em] text-sm">
              Level 4 Clearance Required
            </p>
          </div>
          <AuthInterface />
        </section>

        <Capabilities />
        <About />

        {/* Footer */}
        <footer className="py-24 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm font-mono text-white/40 uppercase">
            © 2026 SCORPION
          </div>
          <div className="flex gap-8 text-sm font-mono">
            <span className="text-green-500">GATEWAY: ONLINE</span>
            <span className="text-white/40 uppercase">Version: 1.0.0</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
