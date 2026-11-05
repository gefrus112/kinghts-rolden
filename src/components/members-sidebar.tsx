"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { initialsAvatarColor, isOnline, timeAgo, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EnrichedMember } from "@/lib/types";

interface MembersSidebarProps {
  members: EnrichedMember[];
  loading: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (username: string) => void;
  onRefresh: () => void;
}

export function MembersSidebar({
  members,
  loading,
  error,
  selected,
  onSelect,
  onRefresh,
}: MembersSidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? members.filter(
          (m) => m.username.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q),
        )
      : members;
    return [...list].sort((a, b) => {
      const aOnline = isOnline(a.lastOnline) ? 1 : 0;
      const bOnline = isOnline(b.lastOnline) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      return a.username.localeCompare(b.username);
    });
  }, [members, query]);

  return (
    <aside id="players" className="scroll-mt-24">
      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-900">
              Club Players
            </h2>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              {loading ? "…" : members.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-700 hover:bg-emerald-100"
            onClick={onRefresh}
            aria-label="Refresh members"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        <div className="border-b border-emerald-100 px-3 py-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players…"
              className="h-9 border-emerald-100 pl-8 focus-visible:ring-emerald-500"
              aria-label="Search club players"
            />
          </div>
        </div>

        <div className="nice-scrollbar max-h-[540px] overflow-y-auto">
          {loading && members.length === 0 ? (
            <div className="space-y-2 px-3 py-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : error && members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <UserX className="h-8 w-8 text-emerald-300" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={onRefresh} className="mt-1">
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No players match “{query}”.
            </p>
          ) : (
            <ul className="divide-y divide-emerald-50">
              {filtered.map((m) => (
                <li key={m.username}>
                  <button
                    onClick={() => onSelect(m.username)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition focus-visible:bg-emerald-50",
                      selected?.toLowerCase() === m.username.toLowerCase()
                        ? "bg-emerald-50 ring-1 ring-inset ring-emerald-200"
                        : "hover:bg-emerald-50/60",
                    )}
                    aria-pressed={selected?.toLowerCase() === m.username.toLowerCase()}
                  >
                    <span className="relative">
                      {m.avatar ? (
                        
                        <img
                          src={m.avatar}
                          alt={`${m.username} avatar`}
                          className="h-10 w-10 rounded-full border border-emerald-100 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${initialsAvatarColor(m.username)}`}
                        >
                          {m.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                          isOnline(m.lastOnline) ? "bg-green-500" : "bg-gray-300",
                        )}
                        title={isOnline(m.lastOnline) ? "Online now" : `Last seen ${timeAgo(m.lastOnline)}`}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-emerald-950">
                          {m.username}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {m.name ? m.name : `Joined ${formatDate(m.joined)}`}
                      </span>
                    </span>
                    {m.ratings?.rapid ? (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-emerald-200 bg-white text-xs font-semibold text-emerald-800"
                      >
                        {m.ratings.rapid}
                      </Badge>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-emerald-100 bg-emerald-50/50 px-4 py-2">
          <p className="text-[11px] leading-snug text-muted-foreground">
            Click a player to watch their recent games
          </p>
        </div>
      </div>
    </aside>
  );
}
