"use client";

import { cn } from "@/lib/utils";

interface SourceBadgeProps {
  source?: string;
  className?: string;
}

/**
 * Tiny indicator showing where the data came from.
 * "direct" = live from the Chess.com API; anything else = cached / fallback data.
 */
export function SourceBadge({ source, className }: SourceBadgeProps) {
  if (!source || source === "direct") {
    return (
      <span
        title="Live data from the Chess.com Public API"
        className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600", className)}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    );
  }
  return (
    <span
      title={`Chess.com API was temporarily unreachable — showing ${source} data`}
      className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600", className)}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Cached
    </span>
  );
}
