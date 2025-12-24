"use client";

interface ProgressBarProps {
  progress: number; // 0 - 100
  className?: string;
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`border-4 border-black bg-gray-200 h-8 relative overflow-hidden ${className}`}>
      <div
        className="h-full bg-green-400 transition-all duration-300"
        style={{ width: `${clampedProgress}%` }}
      >
        <div className="h-full w-full" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 4px,
            rgba(0,0,0,0.1) 4px,
            rgba(0,0,0,0.1) 8px
          )`
        }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {clampedProgress.toFixed(0)}%
      </div>
    </div>
  );
}
























