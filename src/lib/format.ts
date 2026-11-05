export function timeAgo(unixSeconds?: number): string {
  if (!unixSeconds) return "unknown";
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 0) return "now";
  if (diff < 60) return "just now";
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function isOnline(lastOnline?: number): boolean {
  if (!lastOnline) return false;
  return Date.now() / 1000 - lastOnline < 300;
}

export function formatDate(unixSeconds?: number): string {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(unixSeconds?: number): string {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Countdown until a unix-seconds timestamp; returns null once passed. */
export function countdownTo(unixSeconds: number | undefined, nowMs: number): string | null {
  if (!unixSeconds) return null;
  const diff = unixSeconds * 1000 - nowMs;
  if (diff <= 0) return null;
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

const DRAW_RESULTS = new Set([
  "agreed",
  "repetition",
  "stalemate",
  "insufficient",
  "50move",
  "timevsinsufficient",
  "threecheck",
]);

export type ResultBadge = "win" | "loss" | "draw";

export function resultForPlayer(result?: string): ResultBadge {
  if (!result) return "draw";
  const r = result.toLowerCase();
  if (r === "win") return "win";
  if (DRAW_RESULTS.has(r)) return "draw";
  return "loss";
}

export function initialsAvatarColor(username: string): string {
  const palette = [
    "bg-emerald-600",
    "bg-teal-600",
    "bg-green-700",
    "bg-lime-700",
    "bg-emerald-700",
    "bg-green-600",
  ];
  let hash = 0;
  for (const c of username) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return palette[Math.abs(hash) % palette.length];
}
