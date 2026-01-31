import React from "react";

export function ScorpionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Circle (Broken for Claws) */}
      <path
        d="M32 88 A 42 42 0 1 1 68 88"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Scorpion Silhouette */}
      <path d="
        M50 78
        C 42 78, 38 68, 42 58
        C 42 53, 45 48, 50 48
        C 55 48, 58 53, 58 58
        C 62 68, 58 78, 50 78 Z
        
        M50 48
        C 50 20, 70 15, 75 35
        C 78 45, 60 55, 55 45
        C 52 40, 50 35, 50 35
        L 48 32
        C 48 32, 50 48, 50 48 Z
        
        M52 38
        L 42 28
        L 55 22
        Z
        
        M42 68
        C 30 63, 10 70, 10 85
        C 10 100, 30 105, 45 95
        C 48 93, 45 80, 45 80
        L 42 68 Z
        
        M58 68
        C 70 63, 90 70, 90 85
        C 90 100, 70 105, 55 95
        C 52 93, 55 80, 55 80
        L 58 68 Z
        
        M40 58 Q 25 58 20 48
        M40 63 Q 25 68 20 78
        M60 58 Q 75 58 80 48
        M60 63 Q 75 68 80 78
      " />
    </svg>
  );
}
