"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export function AuthInterface() {
  const { status } = useSession();
  const router = useRouter();
  const [authError, setAuthError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });
    if (result?.error) {
      setAuthError("Invalid credentials.");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-white font-mono">Loading authentication...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="border border-white/10 bg-white/5 p-8 rounded-sm max-w-md w-full text-center">
        <h2 className="font-mono text-xs tracking-[0.3em] uppercase text-white/40 mb-6">Security Access Required</h2>
        <form onSubmit={handleCredentialsSignIn} className="space-y-4 text-left">
          <div>
            <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-white outline-none transition-colors"
              placeholder="Username"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase text-white/60 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/20 p-3 font-mono text-sm focus:border-white outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          {authError && <p className="text-red-500 font-mono text-[10px] uppercase">{authError}</p>}
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

  return null; // Redirect handled by useEffect
}
