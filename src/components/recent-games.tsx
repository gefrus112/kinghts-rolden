"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GameViewer } from "@/components/game-viewer";
import { SourceBadge } from "@/components/source-badge";
import {
  initialsAvatarColor,
  isOnline,
  resultForPlayer,
  timeAgo,
  type ResultBadge,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EnrichedMember, PlayerDataResponse, RecentGame } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

interface RecentGamesProps {
  members: EnrichedMember[];
  selectedMember: string | null;
  onSelectMember: (username: string) => void;
}

export function RecentGames({ members, selectedMember, onSelectMember }: RecentGamesProps) {
  const [openGameForMember, setOpenGameForMember] = useState<{ member: string; game: RecentGame } | null>(null);
  const [query, setQuery] = useState("");

  const playerQ = useQuery({
    queryKey: ["player", selectedMember],
    queryFn: () =>
      fetchJson<PlayerDataResponse>(`/api/club/player?username=${encodeURIComponent(selectedMember!)}`),
    enabled: Boolean(selectedMember),
  });

  const data = playerQ.data ?? null;
  const loading = Boolean(selectedMember) && playerQ.isPending;
  const error = playerQ.error instanceof Error ? playerQ.error.message : null;
  // A selected game is only valid for the member it was opened from
  const openGame =
    openGameForMember && openGameForMember.member === selectedMember
      ? openGameForMember.game
      : null;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = members.filter((m) => !q || m.username.toLowerCase().includes(q));
    return base.slice(0, 8);
  }, [members, query]);

  if (!selectedMember) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-emerald-950">Recent Games</h2>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-12 text-center">
          <span className="text-5xl" aria-hidden="true">
            {"\u265E\uFE0E"}
          </span>
          <p className="max-w-md text-sm text-muted-foreground">
            Pick a club player from the list on the left (or search below) to browse and replay
            their recent games move by move.
          </p>
          <div className="w-full max-w-xs space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a player…"
                className="pl-8"
                aria-label="Find a player"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {suggestions.map((m) => (
                <Button
                  key={m.username}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectMember(m.username)}
                  className="h-7 border-emerald-200 px-2.5 text-xs text-emerald-800"
                >
                  {m.username}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-emerald-950">Recent Games</h2>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => playerQ.refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <div className="space-y-4">
      {/* Player header card */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
        {profile?.avatar ? (
          
          <img
            src={profile.avatar}
            alt={`${profile.username} avatar`}
            className="h-14 w-14 rounded-full border border-emerald-100 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white ${initialsAvatarColor(selectedMember)}`}
          >
            {selectedMember.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-emerald-950">{profile?.username || selectedMember}</h2>
            <span className="relative flex h-2.5 w-2.5" title={isOnline(profile?.last_online) ? "Online now" : `Last seen ${timeAgo(profile?.last_online)}`}>
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  isOnline(profile?.last_online) ? "bg-green-500" : "bg-gray-300",
                )}
              />
            </span>
            {profile?.countryFlag && <span className="text-lg">{profile.countryFlag}</span>}
            {profile?.league && (
              <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                {profile.league} League
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.name ? `${profile.name} · ` : ""}
            {profile?.url ? (
              <a
                href={profile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
              >
                Chess.com profile <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              "Profile unavailable"
            )}
            {" · "}
            Active {timeAgo(profile?.last_online)}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {data?.ratings?.rapid ? (
              <RatingChip label="Rapid" value={data.ratings.rapid} />
            ) : null}
            {data?.ratings?.blitz ? <RatingChip label="Blitz" value={data.ratings.blitz} /> : null}
            {data?.ratings?.bullet ? (
              <RatingChip label="Bullet" value={data.ratings.bullet} />
            ) : null}
            {data?.ratings?.daily ? <RatingChip label="Daily" value={data.ratings.daily} /> : null}
          </div>
        </div>
        <SourceBadge source={data?.source} />
      </div>

      {openGame ? (
        <GameViewer game={openGame} onBack={() => setOpenGameForMember(null)} />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-900">
              Recent Games
            </h3>
            {data?.games?.length ? (
              <span className="text-xs text-muted-foreground">
                Click a game to watch it move by move
              </span>
            ) : null}
          </div>

          {data?.games?.length ? (
            <ul className="nice-scrollbar max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {data.games.map((g) => (
                <GameRow
                  key={g.url}
                  game={g}
                  member={selectedMember}
                  onClick={() => setOpenGameForMember({ member: selectedMember, game: g })}
                />
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-10 text-center text-sm text-muted-foreground">
              No recent games found for this player in the last two months.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RatingChip({ label, value }: { label: string; value: number }) {
  return (
    <Badge variant="secondary" className="bg-emerald-50 text-xs text-emerald-900">
      {label} {value}
    </Badge>
  );
}

function GameRow({ game, member, onClick }: { game: RecentGame; member: string; onClick: () => void }) {
  const memberIsWhite = game.white?.username?.toLowerCase() === member.toLowerCase();
  const opponent = memberIsWhite ? game.black : game.white;
  const ownResult = memberIsWhite ? game.whiteResult : game.blackResult;
  const badge: ResultBadge = resultForPlayer(ownResult);

  const badgeStyles: Record<ResultBadge, string> = {
    win: "bg-green-100 text-green-800 border-green-200",
    loss: "bg-red-100 text-red-700 border-red-200",
    draw: "bg-amber-100 text-amber-800 border-amber-200",
  };
  const badgeLabel: Record<ResultBadge, string> = { win: "Win", loss: "Loss", draw: "Draw" };

  const playedWhite = memberIsWhite;

  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg border border-emerald-100 bg-white px-3 py-2.5 text-left outline-none transition hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-bold",
            playedWhite ? "bg-gray-100 text-gray-800" : "bg-gray-800 text-white",
          )}
          title={playedWhite ? "Played White" : "Played Black"}
        >
          {playedWhite ? "W" : "B"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-emerald-950">
            vs {opponent?.username || "Unknown"}
          </span>
          <span className="block text-xs text-muted-foreground">
            {opponent?.rating ? `${opponent.rating} · ` : ""}
            {game.timeClass || "chess"} · {timeAgo(game.endTime)}
            {game.rated ? " · Rated" : ""}
          </span>
        </span>
        <Badge variant="outline" className={cn("shrink-0 border font-semibold", badgeStyles[badge])}>
          {badgeLabel[badge]}
        </Badge>
      </button>
    </li>
  );
}
