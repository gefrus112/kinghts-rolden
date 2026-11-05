import { cn } from "@/lib/utils";

/**
 * Knight chess piece SVG (classic Staunton silhouette).
 * Piece artwork: "Chess klt45" by Colin M.L. Burnett — Wikimedia Commons, CC BY-SA 3.0.
 */
export function KnightPiece({
  className,
  fill = "currentColor",
  stroke = "transparent",
}: {
  className?: string;
  fill?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 45 45"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fillRule="evenodd"
      >
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" />
        <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" strokeLinejoin="miter" />
        <path
          d="M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z"
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  );
}

/** Green app-icon tile with a white knight — the club brand mark. */
export function KnightMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm",
        "h-10 w-10",
        className
      )}
    >
      <KnightPiece className="h-7 w-7" fill="#ffffff" stroke="#065f46" />
    </span>
  );
}
