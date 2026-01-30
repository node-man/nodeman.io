"use client";

import { useRef, ReactNode } from "react";
import { useCardTilt } from "@/hooks/useMousePosition";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  tiltIntensity?: number;
}

export default function GlassCard({ 
  children, 
  className = "", 
  tiltIntensity = 3 
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  useCardTilt(cardRef, tiltIntensity);

  return (
    <div ref={cardRef} className={`glass-card ${className}`}>
      {children}
    </div>
  );
}
