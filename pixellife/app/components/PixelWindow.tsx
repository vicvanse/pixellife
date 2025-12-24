"use client";

import { ReactNode } from "react";

interface PixelWindowProps {
  children: ReactNode;
  className?: string;
}

export default function PixelWindow({ children, className = "" }: PixelWindowProps) {
  return (
    <div className={`pixel-window ${className}`}>
      <div className="tl" />
      <div className="t" />
      <div className="tr" />

      <div className="l" />
      <div className="mid">{children}</div>
      <div className="r" />

      <div className="bl" />
      <div className="b" />
      <div className="br" />
    </div>
  );
}
