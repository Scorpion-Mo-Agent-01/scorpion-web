import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Capabilities } from "@/components/sections/capabilities";
import { ScorpionIcon } from "@/components/scorpion-icon";

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
        </div>
      </nav>

      <main className="pt-32 px-8 max-w-6xl mx-auto">
        <Hero />
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
