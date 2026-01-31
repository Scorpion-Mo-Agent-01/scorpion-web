import React from "react";
import { GiScorpion } from "react-icons/gi";

export function ScorpionIcon({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer technical ring matching the reference style */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full text-current"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
      >
        <path 
          d="M 32 88 A 42 42 0 1 1 68 88" 
          strokeLinecap="round" 
        />
      </svg>
      
      {/* High-quality solid silhouette scorpion */}
      <GiScorpion className="w-[60%] h-[60%] relative z-10 text-current translate-y-[-2%]" />
    </div>
  );
}
