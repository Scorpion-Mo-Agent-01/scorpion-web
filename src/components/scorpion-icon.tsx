import React from "react";
import Image from "next/image";

export function ScorpionIcon({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <Image
        src="/scorpion.jpg"
        alt="Scorpion"
        width={1000}
        height={1000}
        className="w-full h-full object-contain invert brightness-200"
        priority
      />
    </div>
  );
}
