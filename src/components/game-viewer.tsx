"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChessBoard } from "@/components/chess-board";
import type { RecentGame } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ParsedGame {
  fens: string[];
  moves: Array<{ san: string; from: string; to: string }>;
  headers: Record<string, string>;
}

function parsePgn(pgn?: string): ParsedGame | null {
  if (!pgn) return null;
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const verbose = chess.history({ verbose: true });
    const replay = new Chess();
    const fens: string[] = [replay.fen()];
    const moves: ParsedGame["moves"] = [];
    for (const mv of verbose) {
      replay.move(mv.san);
      fens.push(replay.fen());
      moves.push({ san: mv.san, from: mv.from, to: mv.to });
    }
    const headers = chess.getHeaders();
    return { fens, moves, headers };
  } catch {
    return null;
  }
}

interface GameViewerProps {
  game: RecentGame;
  onBack?: () => void;
}

export function GameViewer({ game, onBack }: GameViewerProps) {
  const parsed = useMemo(() => parsePgn(game.pgn), [game.url, game.pgn]);
  const [ply, setPly] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [prevUrl, setPrevUrl] = useState(game.url);
  const moveListRef = useRef<HTMLDivElement>(null);
  const activeMoveRef = useRef<HTMLSpanElement>(null);

  const total = parsed ? parsed.fens.length - 1 : 0;

  // Reset playback when the game changes (adjust state during render,
  // per the React "you might not need an effect" pattern)
  if (prevUrl !== game.url) {
    setPrevUrl(game.url);
    setPly(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPly((p) => {
        if (p >= total) {
          setPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, 1100);
    return () => clearInterval(id);
  }, [playing, total]);

  useEffect(() => {
    activeMoveRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [ply]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setPlaying(false);
        setPly((p) => Math.max(0, p - 1));
      } else if (e.key === "ArrowRight") {
        setPlaying(false);
        setPly((p) => Math.min(total, p + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const lastMove =
    parsed && ply > 0 ? { from: parsed.moves[ply - 1].from, to: parsed.moves[ply - 1].to } : null;

  const h = parsed?.headers ?? {};
  const whiteName = h.White || game.white?.username || "White";
  const blackName = h.Black || game.black?.username || "Black";
  const result = h.Result || "?";

  const resultLabel =
    result === "1-0"
      ? `${whiteName} won`
      : result === "0-1"
        ? `${blackName} won`
        : result === "1/2-1/2"
          ? "Draw"
          : "In progress";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="border-emerald-200">
              <ChevronLeft className="mr-1 h-4 w-4" /> Games
            </Button>
          )}
          <div>
            <h3 className="text-sm font-bold text-emerald-950">
              {whiteName} <span className="mx-1 text-muted-foreground">vs</span> {blackName}
            </h3>
            <p className="text-xs text-muted-foreground">
              {[h.Event, h.Date, h.TimeControl && `${h.TimeControl}`, resultLabel]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            {resultLabel}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-emerald-200 text-emerald-800"
          >
            <a href={game.url} target="_blank" rel="noopener noreferrer">
              Chess.com <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <ChessBoard
          fen={parsed ? parsed.fens[ply] : game.fen}
          orientation={flipped ? "black" : "white"}
          lastMove={lastMove}
          className="mx-auto w-full max-w-[560px]"
        />

        <div className="flex min-h-0 flex-col gap-3">
          <div className="grid grid-cols-6 gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-9 border-emerald-200"
              onClick={() => {
                setPlaying(false);
                setPly(0);
              }}
              aria-label="Jump to start"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 border-emerald-200"
              onClick={() => {
                setPlaying(false);
                setPly((p) => Math.max(0, p - 1));
              }}
              aria-label="Previous move"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 border-emerald-200 text-emerald-700"
              onClick={() => {
                if (ply >= total) setPly(0);
                setPlaying((p) => !p);
              }}
              aria-label={playing ? "Pause autoplay" : "Autoplay"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 border-emerald-200"
              onClick={() => {
                setPlaying(false);
                setPly((p) => Math.min(total, p + 1));
              }}
              aria-label="Next move"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 border-emerald-200"
              onClick={() => {
                setPlaying(false);
                setPly(total);
              }}
              aria-label="Jump to end"
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 border-emerald-200 text-emerald-700"
              onClick={() => setFlipped((f) => !f)}
              aria-label="Flip board"
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="nice-scrollbar max-h-[340px] min-h-[180px] overflow-y-auto rounded-lg border border-emerald-100 bg-emerald-50/40 p-2"
            ref={moveListRef}
            aria-label="Move list"
          >
            {parsed ? (
              <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-2 text-sm">
                {chunkMoves(parsed.moves).map((row) => {
                  const whitePly = row.no * 2 - 1;
                  const blackPly = row.no * 2;
                  return (
                    <div key={row.no} className="col-span-3 grid grid-cols-[auto_1fr_1fr] gap-x-2">
                      <span className="py-0.5 text-right text-xs font-semibold text-muted-foreground">
                        {row.no}.
                      </span>
                      <MoveButton
                        san={row.white}
                        ply={whitePly}
                        activePly={ply}
                        onSelect={(p) => {
                          setPlaying(false);
                          setPly(p);
                        }}
                        ref={whitePly === ply ? activeMoveRef : undefined}
                      />
                      {row.black ? (
                        <MoveButton
                          san={row.black}
                          ply={blackPly}
                          activePly={ply}
                          onSelect={(p) => {
                            setPlaying(false);
                            setPly(p);
                          }}
                          ref={blackPly === ply ? activeMoveRef : undefined}
                        />
                      ) : (
                        <span />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No move data available for this game — showing the final position.
              </p>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Move {ply}/{total} · use ⬅️ ➡️ arrow keys
          </p>
        </div>
      </div>
    </div>
  );
}

function MoveButton({
  san,
  ply,
  activePly,
  onSelect,
  ref,
}: {
  san: string;
  ply: number;
  activePly: number;
  onSelect: (ply: number) => void;
  ref?: React.Ref<HTMLSpanElement>;
}) {
  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(ply)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(ply);
      }}
      className={cn(
        "cursor-pointer rounded px-1.5 py-0.5 font-mono text-[13px] outline-none transition",
        ply === activePly
          ? "bg-emerald-600 font-semibold text-white"
          : "text-emerald-950 hover:bg-emerald-100",
      )}
    >
      {san}
    </span>
  );
}

function chunkMoves(moves: Array<{ san: string }>): Array<{ no: number; white?: string; black?: string }> {
  const rows: Array<{ no: number; white?: string; black?: string }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ no: i / 2 + 1, white: moves[i]?.san, black: moves[i + 1]?.san });
  }
  return rows;
}
