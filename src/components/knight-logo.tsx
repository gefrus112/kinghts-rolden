import { cn } from "@/lib/utils";

interface KnightLogoProps {
  size?: number;
  className?: string;
}

/**
 * Knight chess piece logo — green badge with a knight glyph.
 */
export function KnightLogo({ size = 40, className }: KnightLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("shrink-0 drop-shadow-sm", className)}
      role="img"
      aria-label="Kinghts Rolden knight logo"
    >
      <defs>
        <linearGradient id="kr-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16a34a" />
          <stop offset="1" stopColor="#14532d" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#kr-logo-g)" />
      <text
        x="50"
        y="73"
        fontFamily="'Segoe UI Symbol','Noto Sans Symbols 2','DejaVu Sans','Apple Symbols',serif"
        fontSize="64"
        textAnchor="middle"
        fill="#ffffff"
      >
        {"\u265E\uFE0E"}
      </text>
    </svg>
  );
}
