import React from "react";

export function ScorpionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Precision Scorpion Tail */}
      <path d="M50 85 C 50 85, 50 65, 50 60 C 50 50, 70 45, 75 35 C 80 25, 70 15, 60 15 C 55 15, 50 20, 50 20" />
      <path d="M50 20 L 45 10 L 55 10 Z" fill="currentColor" stroke="none" />
      
      {/* Technical Body Segments */}
      <rect x="42" y="60" width="16" height="8" rx="2" />
      <rect x="40" y="50" width="20" height="8" rx="2" />
      <rect x="38" y="40" width="24" height="8" rx="2" />
      
      {/* High-Precision Claws */}
      <path d="M38 44 C 30 44, 20 40, 20 30 L 20 20 M 20 25 L 15 25 M 20 20 L 25 20" />
      <path d="M62 44 C 70 44, 80 40, 80 30 L 80 20 M 80 25 L 85 25 M 80 20 L 75 20" />
      
      {/* Multi-jointed Legs */}
      <path d="M38 54 L 25 54 L 20 60" />
      <path d="M38 64 L 25 64 L 20 70" />
      <path d="M62 54 L 75 54 L 80 60" />
      <path d="M62 64 L 75 64 L 80 70" />
    </svg>
  );
}
