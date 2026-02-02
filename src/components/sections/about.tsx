import { Card, CardContent } from "@/components/ui/card";

export function About() {
  const channels = ["TELEGRAM", "DISCORD", "WHATSAPP", "SLACK", "SIGNAL", "IMESSAGE"];

  return (
    <section id="about" className="py-24 border-t border-white/10">
      <div className="grid md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-sm font-mono text-white/40 mb-8 tracking-[0.3em]">THE MANIFESTO</h2>
          <p className="text-3xl leading-relaxed">
            Scorpion isn&apos;t just a bot—it&apos;s a high-precision extension of your workflow. 
            Unlike SaaS assistants, it lives where you choose. Your laptop, your homelab, your VPS.
          </p>
        </div>
        <div className="space-y-8">
          <h2 className="text-sm font-mono text-white/40 mb-8 tracking-[0.3em]">CHANNELS</h2>
          <div className="grid grid-cols-2 gap-4">
            {channels.map((channel) => (
              <Card key={channel} className="bg-white/5 border-white/10 rounded-none">
                <CardContent className="p-4 flex items-center justify-center font-mono text-sm">
                  {channel}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
