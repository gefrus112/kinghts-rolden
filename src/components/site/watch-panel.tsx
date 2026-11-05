"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  Eye,
  FastForward,
  Pause,
  Play,
  RefreshCcw,
  Rewind,
  SkipBack,
  SkipForward,
  Swords,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChessBoard } from "@/components/site/chess-board";
import type { ClubData, GameRecord, GamesData, MembersData, SessionInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ----------------------------- helpers ----------------------------- */

function fmtDate(unix?: number) {
  if (!unix) return "";
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(unix?: number) {
  if (!unix) return "";
  return new Date(unix * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function outcome(game: GameRecord): "1-0" | "0-1" | "draw" {
  if (game.white.result === "won") return "1-0";
  if (game.black.result === "won") return "0-1";
  return "draw";
}

const TC_STYLES: Record<string, string> = {
  bullet: "bg-slate-100 text-slate-700",
  blitz: "bg-amber-100 text-amber-800",
  rapid: "bg-emerald-100 text-emerald-800",
  daily: "bg-violet-100 text-violet-800",
  casual: "bg-stone-100 text-stone-700",
};

function TimeClassBadge({ tc }: { tc: string }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
        TC_STYLES[tc] ?? "bg-stone-100 text-stone-700"
      )}
    >
      {tc}
    </span>
  );
}

/* --------------------------- match cards --------------------------- */

function MatchCard({ match }: { match: ClubData["matches"][number] }) {
  const live = match.status === "in_progress";
  const scheduled = match.status === "registered";
  return (
    <Card
      className={cn(
        "border-emerald-100 transition-shadow hover:shadow-md",
        live && "ring-2 ring-emerald-500/60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
              LIVE NOW
            </span>
          ) : scheduled ? (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              Scheduled
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-stone-100 text-stone-600">
              Finished
            </Badge>
          )}
          {match.timeClass && <TimeClassBadge tc={match.timeClass} />}
        </div>
        <h4 className="mt-2 truncate text-sm font-bold text-emerald-950">
          {match.name}
        </h4>
        {match.opponent && (
          <p className="text-xs text-emerald-900/60">vs {match.opponent}</p>
        )}
        <p className="mt-1 text-xs text-emerald-900/50">
          {live
            ? "In progress right now"
            : scheduled
              ? `Starts ${fmtDateTime(match.startTime)}`
              : fmtDate(match.startTime)}
          {match.status === "finished" && match.result
            ? ` · Club result: ${match.result}`
            : ""}
        </p>
        <Button
          asChild
          size="sm"
          className={cn(
            "mt-3 w-full",
            live ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
          )}
          variant={live ? "default" : "outline"}
        >
          <a href={match.url} target="_blank" rel="noopener noreferrer">
            {live ? "Watch on Chess.com" : "Open match"}{" "}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function MatchesEmpty() {
  return (
    <Card className="border-dashed border-emerald-200 bg-emerald-50/40">
      <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
        <Swords className="h-10 w-10 text-emerald-900/25" />
        <p className="text-sm font-semibold text-emerald-950">
          No club matches yet
        </p>
        <p className="max-w-md text-xs leading-relaxed text-emerald-900/60">
          Team matches your club plays will appear here automatically — live
          ones with a pulsing badge. In the meantime, challenge a clubmate and
          your games will show up in the replay theater below.
        </p>
        <Button
          asChild
          size="sm"
          className="mt-1 bg-emerald-600 hover:bg-emerald-700"
        >
          <a
            href="https://www.chess.com/club/kinghts-rolden"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit the club on Chess.com <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

/* --------------------------- replay theater ------------------------ */

function ReplayTheater({
  members,
  session,
  player,
  onPlayerChange,
}: {
  members: MembersData["members"];
  session: SessionInfo | null;
  player: string;
  onPlayerChange: (u: string) => void;
}) {
  const [gamesData, setGamesData] = useState<GamesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameIdx, setGameIdx] = useState(0);
  const [ply, setPly] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState("1100");
  const [flipped, setFlipped] = useState(false);
  const moveListRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (username: string) => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/games?username=${encodeURIComponent(username)}`
      );
      const data = (await res.json()) as GamesData & { error?: string };
      setGamesData(res.ok ? data : { live: false, username, games: [] });
    } catch {
      setGamesData({ live: false, username, games: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (player) void load(player);
  }, [player, load]);

  const games = gamesData?.games ?? [];
  const game: GameRecord | null = games[gameIdx] ?? null;
  const totalPlies = game?.moves.length ?? 0;

  useEffect(() => {
    setGameIdx(0);
    setPly(0);
    setAutoplay(false);
  }, [gamesData]);

  // Autoplay ticker
  useEffect(() => {
    if (!autoplay || !game) return;
    if (ply >= totalPlies) {
      setAutoplay(false);
      return;
    }
    const t = setTimeout(() => setPly((p) => Math.min(p + 1, totalPlies)), Number(speed));
    return () => clearTimeout(t);
  }, [autoplay, ply, totalPlies, speed, game]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") setPly((p) => Math.max(0, p - 1));
      else if (e.key === "ArrowRight") setPly((p) => Math.min(totalPlies, p + 1));
      else if (e.key === " ") {
        e.preventDefault();
        setAutoplay((a) => !a);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalPlies]);

  // Keep current move in view
  useEffect(() => {
    if (moveListRef.current) {
      const el = moveListRef.current.querySelector("[data-current='true']");
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [ply]);

  const fen = game ? game.fens[Math.min(ply, totalPlies)] : "";
  const lastMove = game && ply > 0 ? game.fromTo[ply - 1] : null;

  const moveRows = useMemo(() => {
    if (!game) return [];
    const rows: { no: number; white?: { san: string; ply: number }; black?: { san: string; ply: number } }[] = [];
    for (let i = 0; i < game.moves.length; i += 2) {
      rows.push({
        no: i / 2 + 1,
        white: { san: game.moves[i], ply: i + 1 },
        black:
          game.moves[i + 1] !== undefined
            ? { san: game.moves[i + 1], ply: i + 2 }
            : undefined,
      });
    }
    return rows;
  }, [game]);

  return (
    <div className="space-y-4">
      {/* Player picker */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={player} onValueChange={onPlayerChange}>
          <SelectTrigger
            className="w-[230px] border-emerald-200 bg-white"
            aria-label="Choose a player to watch"
          >
            <SelectValue placeholder="Choose a player…" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.username} value={m.username}>
                {m.username}
                {session?.username === m.username ? " (you)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="border-emerald-200 text-emerald-700"
          aria-label="Reload games"
          onClick={() => void load(player)}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
        {gamesData && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              gamesData.live
                ? "bg-emerald-600/10 text-emerald-700"
                : "bg-amber-500/10 text-amber-700"
            )}
            title={
              gamesData.live
                ? "Recent games loaded from the Chess.com API"
                : "Chess.com is unreachable from this network — showing historic demo games so you can try the replay theater"
            }
          >
            {gamesData.live
              ? `● ${games.length} recent game${games.length === 1 ? "" : "s"} from Chess.com`
              : "◐ offline preview — historic demo games"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : !game ? (
        <Card className="border-dashed border-emerald-200 bg-emerald-50/40">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Eye className="h-10 w-10 text-emerald-900/25" />
            <p className="text-sm font-semibold text-emerald-950">
              No games to replay yet
            </p>
            <p className="max-w-md text-xs leading-relaxed text-emerald-900/60">
              Once <span className="font-semibold">{player || "this player"}</span>{" "}
              finishes some games on chess.com, they will appear here
              automatically. Try another player from the list.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Game list */}
          <div className="order-2 lg:order-1">
            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {games.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setGameIdx(i);
                    setPly(0);
                    setAutoplay(false);
                  }}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    i === gameIdx
                      ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-400"
                      : "border-emerald-100 bg-white hover:bg-emerald-50/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-emerald-950">
                      {g.white.username}{" "}
                      <span className="font-normal text-emerald-900/50">
                        ({g.white.rating ?? "?"})
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-extrabold text-emerald-800">
                      {outcome(g) === "draw" ? "½–½" : outcome(g) === "1-0" ? "1–0" : "0–1"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-emerald-900/70">
                      {g.black.username}{" "}
                      <span className="text-emerald-900/50">
                        ({g.black.rating ?? "?"})
                      </span>
                    </span>
                    <TimeClassBadge tc={g.timeClass} />
                  </div>
                  {g.demo ? (
                    <p className="mt-1 truncate text-[11px] font-medium text-amber-700">
                      {g.demoTitle}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-emerald-900/50">
                      {fmtDate(g.endTime)} · {g.moves.length} plies
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Board + controls */}
          <div className="order-1 lg:order-2">
            <Card className="border-emerald-100">
              <CardContent className="p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-emerald-950">
                      {flipped
                        ? `${game.black.username} (${game.black.rating ?? "?"})`
                        : `${game.white.username} (${game.white.rating ?? "?"})`}
                      <span className="mx-1.5 font-normal text-emerald-900/40">vs</span>
                      {flipped
                        ? `${game.white.username} (${game.white.rating ?? "?"})`
                        : `${game.black.username} (${game.black.rating ?? "?"})`}
                    </p>
                    <p className="text-[11px] text-emerald-900/50">
                      {game.demo ? game.demoTitle : fmtDate(game.endTime)} ·{" "}
                      {outcome(game) === "draw"
                        ? "draw"
                        : outcome(game) === "1-0"
                          ? "1–0"
                          : "0–1"}{" "}
                      ({game.white.result} / {game.black.result})
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 text-emerald-800"
                    onClick={() => setFlipped((f) => !f)}
                  >
                    Flip board
                  </Button>
                </div>

                <ChessBoard
                  fen={fen}
                  lastMove={lastMove as [string, string] | null}
                  flipped={flipped}
                />

                {/* Controls */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-emerald-200 text-emerald-800"
                      aria-label="Jump to start"
                      onClick={() => {
                        setPly(0);
                        setAutoplay(false);
                      }}
                    >
                      <Rewind className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-emerald-200 text-emerald-800"
                      aria-label="Previous move"
                      onClick={() => {
                        setPly((p) => Math.max(0, p - 1));
                        setAutoplay(false);
                      }}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700"
                      aria-label={autoplay ? "Pause autoplay" : "Autoplay moves"}
                      onClick={() => {
                        if (!autoplay && ply >= totalPlies) setPly(0);
                        setAutoplay((a) => !a);
                      }}
                    >
                      {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-emerald-200 text-emerald-800"
                      aria-label="Next move"
                      onClick={() => {
                        setPly((p) => Math.min(totalPlies, p + 1));
                        setAutoplay(false);
                      }}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-emerald-200 text-emerald-800"
                      aria-label="Jump to end"
                      onClick={() => {
                        setPly(totalPlies);
                        setAutoplay(false);
                      }}
                    >
                      <FastForward className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-emerald-900/50 sm:inline">
                      move {Math.ceil(ply / 2) || "–"}/{Math.ceil(totalPlies / 2)}
                    </span>
                    <Select value={speed} onValueChange={setSpeed}>
                      <SelectTrigger
                        className="h-9 w-[110px] border-emerald-200 text-xs"
                        aria-label="Autoplay speed"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">Fast</SelectItem>
                        <SelectItem value="1100">Normal</SelectItem>
                        <SelectItem value="2200">Slow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Move list */}
                <div
                  ref={moveListRef}
                  className="mt-3 max-h-36 overflow-y-auto rounded-lg border border-emerald-100 bg-emerald-50/40 p-2 [scrollbar-width:thin]"
                >
                  <div className="grid grid-cols-[2rem_1fr_1fr] gap-x-1 text-xs">
                    {moveRows.map((row) => (
                      <div key={row.no} className="col-span-3 grid grid-cols-[2rem_1fr_1fr] gap-x-1">
                        <span className="py-0.5 text-right font-semibold text-emerald-900/40">
                          {row.no}.
                        </span>
                        <button
                          data-current={ply === row.white?.ply}
                          onClick={() => {
                            setPly(row.white!.ply);
                            setAutoplay(false);
                          }}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-left font-medium",
                            ply === row.white?.ply
                              ? "bg-emerald-600 text-white"
                              : "text-emerald-950 hover:bg-emerald-100"
                          )}
                        >
                          {row.white!.san}
                        </button>
                        {row.black ? (
                          <button
                            data-current={ply === row.black.ply}
                            onClick={() => {
                              setPly(row.black!.ply);
                              setAutoplay(false);
                            }}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-left font-medium",
                              ply === row.black.ply
                                ? "bg-emerald-600 text-white"
                                : "text-emerald-950 hover:bg-emerald-100"
                            )}
                          >
                            {row.black.san}
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {!game.demo && game.url && (
                  <Button
                    variant="link"
                    size="sm"
                    asChild
                    className="mt-1 h-auto p-0 text-emerald-700"
                  >
                    <a href={game.url} target="_blank" rel="noopener noreferrer">
                      Open this game on Chess.com <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ panel ------------------------------ */

export function WatchPanel({
  clubData,
  membersData,
  session,
  initialPlayer,
  onConsumeRequest,
}: {
  clubData: ClubData | null;
  membersData: MembersData | null;
  session: SessionInfo | null;
  initialPlayer: string | null;
  onConsumeRequest: () => void;
}) {
  const members = membersData?.members ?? [];
  const [manualPlayer, setManualPlayer] = useState<string | null>(null);

  const defaultPlayer = useMemo(() => {
    return (
      session?.username ??
      members.find((m) => m.isOwner)?.username ??
      members[0]?.username ??
      ""
    );
  }, [session, members]);

  // Requested (via “watch games” buttons) > manual dropdown pick > sensible default.
  const effectivePlayer = initialPlayer ?? manualPlayer ?? defaultPlayer;

  const handlePlayerChange = useCallback(
    (u: string) => {
      setManualPlayer(u);
      onConsumeRequest();
    },
    [onConsumeRequest]
  );

  const inProgress = clubData?.matches.filter((m) => m.status === "in_progress") ?? [];
  const registered = clubData?.matches.filter((m) => m.status === "registered") ?? [];
  const finished = clubData?.matches.filter((m) => m.status === "finished") ?? [];
  const anyMatches = (clubData?.matches.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <section aria-label="Club matches">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
            <Swords className="h-5 w-5 text-emerald-700" />
            Club matches
          </h2>
          <span className="text-xs text-emerald-900/50">
            {inProgress.length} live · {registered.length} scheduled ·{" "}
            {finished.length} finished
          </span>
        </div>
        {!clubData ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : anyMatches ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...inProgress, ...registered, ...finished].map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <MatchesEmpty />
        )}
      </section>

      <section aria-label="Game replay theater">
        <div className="mb-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
            <Eye className="h-5 w-5 text-emerald-700" />
            Game replay theater
          </h2>
          <p className="text-xs text-emerald-900/60">
            Pick any club member and replay their recent Chess.com games
            move-by-move on our own board. Chess.com doesn&apos;t allow its live
            boards to be embedded elsewhere, so live team matches open on
            chess.com — everything else plays right here.
          </p>
        </div>
        <ReplayTheater
          members={members}
          session={session}
          player={effectivePlayer}
          onPlayerChange={handlePlayerChange}
        />
      </section>
    </div>
  );
}
