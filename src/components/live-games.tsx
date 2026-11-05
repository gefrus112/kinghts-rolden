"use client";

import { useEffect, useState } from "react";
import { Eye, RefreshCw, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChessBoard } from "@/components/chess-board";
import { SourceBadge } from "@/components/source-badge";
import { countdownTo } from "@/lib/format";
import type { LiveGame, LiveGamesResponse } from "@/lib/types";

interface LiveGamesProps {
  data: LiveGamesResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function LiveGames({ data, loading, onRefresh }: LiveGamesProps) {
  const now = useNow(1000);
  const games = data?.games ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-emerald-950">Live Games</h2>
          <SourceBadge source={data?.source} />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">
            Auto-refreshes every 60s
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-emerald-200 text-emerald-800"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && games.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-emerald-100 bg-white p-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-14 text-center">
          <span className="text-5xl" aria-hidden="true">
            {"\u265E\uFE0E"}
          </span>
          <h3 className="text-base font-semibold text-emerald-950">No live games right now</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            When club members are playing on Chess.com, their in-progress games will appear here
            automatically. Check the <strong>Recent Games</strong> tab to replay finished games.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((g) => (
            <LiveGameCard key={g.url} game={g} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveGameCard({ game, now }: { game: LiveGame; now: number }) {
  const memberIsBlack = game.black?.toLowerCase() === game.clubMember.toLowerCase();
  const orientation: "white" | "black" = memberIsBlack ? "black" : "white";
  const countdown = countdownTo(game.moveBy, now);
  const whiteName = game.white || "?";
  const blackName = game.black || "?";

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <Badge className="gap-1 bg-red-500 text-white" variant="default">
          <Radio className="h-3 w-3 animate-pulse" />
          LIVE
        </Badge>
        {countdown ? (
          <span className="text-xs font-medium text-amber-600" title="Time left for this move">
            ⏱ {countdown} left
          </span>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">awaiting move</span>
        )}
      </div>

      <ChessBoard fen={game.fen} orientation={orientation} className="w-full" />

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-emerald-950">{whiteName}</span>
          {game.whiteRating ? <span className="text-xs text-muted-foreground">({game.whiteRating})</span> : null}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-emerald-950">{blackName}</span>
          {game.blackRating ? <span className="text-xs text-muted-foreground">({game.blackRating})</span> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Club member{" "}
          <span className="font-semibold text-emerald-700">{game.clubMember}</span> is playing.
        </p>
      </div>

      <Button asChild size="sm" className="mt-auto w-full bg-emerald-600 text-white hover:bg-emerald-700">
        <a href={game.url} target="_blank" rel="noopener noreferrer">
          <Eye className="mr-2 h-4 w-4" />
          Watch on Chess.com
        </a>
      </Button>
    </article>
  );
}
