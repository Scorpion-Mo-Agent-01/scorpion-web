import React from "react";
import Image from "next/image";

export function ScorpionIcon({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src="/scorpion.png"
        alt="Scorpion"
        width={1000}
        height={1000}
        className="w-full h-full object-contain invert grayscale brightness-150"
        priority
      />
    </div>
  );
}
