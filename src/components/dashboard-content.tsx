"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react"; // Import signOut and useSession

interface DashboardStats {
  balance: number;
  memoryFiles: number;
  gatewayStatus: string;
  lastHeartbeat: string;
}

export function DashboardContent() { // Removed username and onLogout props
  const { data: session } = useSession(); // Get session data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Use session.user.name for the username
  const username = session?.user?.name || "Agent";

  useEffect(() => {
    // In a real app, we'd fetch from an API
    // For now, we'll simulate the fetch or use the data we gathered
    setStats({
      balance: 3693.84,
      memoryFiles: 23,
      gatewayStatus: "ONLINE",
      lastHeartbeat: new Date().toISOString()
    });
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message }),
      });

      if (res.ok) {
        setStatus("Message forwarded to Telegram.");
        setMessage("");
      } else {
        setStatus("Failed to send message.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error connecting to server.";
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h2 className="font-mono text-xs tracking-[0.3em] uppercase text-white/40 mb-1">Command Center</h2>
          <p className="font-mono text-2xl font-bold uppercase tracking-tighter">Welcome back, {username}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })} // Use signOut from next-auth/react
          className="px-4 py-2 border border-white/20 font-mono text-[10px] text-white/40 hover:text-white hover:border-white transition-all uppercase"
        >
          Terminate Session
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
          <p className="font-mono text-[10px] uppercase text-white/40 mb-2">Liquid Balance</p>
          <p className="text-3xl font-bold tracking-tighter text-green-500">${stats?.balance.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-[10px] uppercase text-white/40">Polymarket Live</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
          <p className="font-mono text-[10px] uppercase text-white/40 mb-2">Memory Nodes</p>
          <p className="text-3xl font-bold tracking-tighter">{stats?.memoryFiles} Files</p>
          <p className="mt-4 font-mono text-[10px] uppercase text-white/40">Indexed & Synced</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
          <p className="font-mono text-[10px] uppercase text-white/40 mb-2">System Health</p>
          <p className="text-3xl font-bold tracking-tighter uppercase">{stats?.gatewayStatus}</p>
          <p className="mt-4 font-mono text-[10px] uppercase text-white/40">Last Ack: {stats ? new Date(stats.lastHeartbeat).toLocaleTimeString() : '---'}</p>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white/5 border border-white/10 p-8 rounded-sm">
            <h3 className="font-mono text-xs uppercase text-white/60 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              Direct Agent Override
            </h3>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full bg-black border border-white/20 p-4 font-mono text-sm focus:border-white outline-none transition-colors resize-none placeholder:text-white/20"
                placeholder="Send a high-priority directive to Scorpion..."
              />
              <div className="flex justify-between items-center">
                <p className="text-green-500 font-mono text-[10px] uppercase">{status}</p>
                <button
                  disabled={loading}
                  type="submit"
                  className="bg-white text-black font-mono text-xs px-12 py-4 uppercase font-bold hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {loading ? "Transmitting..." : "Execute Command"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-sm h-full">
            <h3 className="font-mono text-xs uppercase text-white/60 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
              Recent Logs
            </h3>
            <div className="space-y-4">
              <div className="border-l border-white/20 pl-4 py-1">
                <p className="font-mono text-[10px] text-white/40 mb-1">02:51:00 UTC</p>
                <p className="font-mono text-xs text-white/80">Session Bootstrapped</p>
              </div>
              <div className="border-l border-white/20 pl-4 py-1">
                <p className="font-mono text-[10px] text-white/40 mb-1">02:50:00 UTC</p>
                <p className="font-mono text-xs text-white/80">Memory Sync Complete</p>
              </div>
              <div className="border-l border-white/20 pl-4 py-1 opacity-50">
                <p className="font-mono text-[10px] text-white/40 mb-1">01:32:00 UTC</p>
                <p className="font-mono text-xs text-white/80">Bedrock Pricing Analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
