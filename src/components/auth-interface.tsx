"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthInterface() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toUpperCase() === "MOYESH" && password === "moyesh123") {
      setIsLoggedIn(true);
      localStorage.setItem("isLoggedIn", "true"); // Persist login status
      setStatus("");
      router.push("/dashboard"); // Redirect to the new dashboard page
    } else {
      setStatus("Invalid credentials.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="border border-white/10 bg-white/5 p-8 rounded-sm max-w-md w-full">
        <h2 className="font-mono text-xs tracking-[0.3em] uppercase text-white/40 mb-6">Security Access</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">User ID</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-white outline-none transition-colors" 
              placeholder="Username"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">Access Key</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-white outline-none transition-colors" 
              placeholder="••••••••"
            />
          </div>
          {status && <p className="text-red-500 font-mono text-[10px] uppercase">{status}</p>}
          <button 
            type="submit"
            className="w-full bg-white text-black font-mono text-xs py-3 uppercase font-bold hover:bg-white/90 transition-colors"
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return null; // Don't render anything if logged in, as we are redirecting
}
