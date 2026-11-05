"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const GLYPHS: Record<string, string> = {
  k: "\u265A\uFE0E",
  q: "\u265B\uFE0E",
  r: "\u265C\uFE0E",
  b: "\u265D\uFE0E",
  n: "\u265E\uFE0E",
  p: "\u265F\uFE0E",
};

const LIGHT_SQ = "#EBECD0";
const DARK_SQ = "#739552";
const HIGHLIGHT = "rgba(255, 213, 79, 0.58)";

const START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface ChessBoardProps {
  fen?: string;
  orientation?: "white" | "black";
  lastMove?: { from: string; to: string } | null;
  className?: string;
  rounded?: boolean;
}

interface Square {
  name: string;
  piece: string | null;
  isWhitePiece: boolean;
  light: boolean;
}

function parseFenBoard(fen?: string): Square[][] {
  const boardPart = (fen && fen.trim().split(/\s+/)[0]) || START_POSITION.split(" ")[0];
  const rows = boardPart.split("/");
  const squares: Square[][] = [];
  for (let ri = 0; ri < 8; ri++) {
    const row = rows[ri] ?? "8";
    const line: Square[] = [];
    let fi = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        const empty = parseInt(ch, 10);
        for (let i = 0; i < empty && fi < 8; i++) {
          line.push({ name: FILES[fi] + (8 - ri), piece: null, isWhitePiece: false, light: false });
          fi++;
        }
      } else if (fi < 8) {
        line.push({
          name: FILES[fi] + (8 - ri),
          piece: ch,
          isWhitePiece: ch === ch.toUpperCase(),
          light: false,
        });
        fi++;
      }
    }
    while (fi < 8) {
      line.push({ name: FILES[fi] + (8 - ri), piece: null, isWhitePiece: false, light: false });
      fi++;
    }
    squares.push(line);
  }
  return squares;
}

/**
 * Static chess board renderer (viewer, not interactive play).
 * Colors follow the classic chess.com green board; pieces scale with the
 * board width via container query units.
 */
export function ChessBoard({
  fen,
  orientation = "white",
  lastMove,
  className,
  rounded = true,
}: ChessBoardProps) {
  const rows = useMemo(() => parseFenBoard(fen), [fen]);

  const ordered = useMemo(() => {
    if (orientation === "white") return rows;
    // flip both axes for black orientation
    return [...rows].reverse().map((r) => [...r].reverse());
  }, [rows, orientation]);

  return (
    <div
      className={cn(
        "select-none overflow-hidden shadow-md ring-1 ring-black/10",
        rounded && "rounded-lg",
        className,
      )}
      style={{ containerType: "inline-size" }}
      aria-label="Chess position board"
      role="img"
    >
      <div className="grid grid-cols-8" style={{ aspectRatio: "1 / 1" }}>
        {ordered.map((row, ri) =>
          row.map((sq, ci) => {
            // square light/dark color: (ri + ci) even -> light when board aligned
            const isLight = (ri + ci) % 2 === 0;
            const fileIdx = orientation === "white" ? ci : 7 - ci;
            const rank = orientation === "white" ? 8 - ri : ri + 1;
            const actualName = FILES[fileIdx] + rank;
            const isHighlighted =
              lastMove && (lastMove.from === actualName || lastMove.to === actualName);
            const showRankLabel = ci === 0;
            const showFileLabel = ri === 7;
            return (
              <div
                key={`${ri}-${ci}`}
                className="relative flex items-center justify-center"
                style={{ backgroundColor: isLight ? LIGHT_SQ : DARK_SQ }}
              >
                {isHighlighted && (
                  <div className="absolute inset-0" style={{ backgroundColor: HIGHLIGHT }} />
                )}
                {sq.piece && (
                  <span
                    className="relative z-10 leading-none"
                    style={{
                      fontSize: "calc(100cqw / 8 * 0.82)",
                      color: sq.isWhitePiece ? "#f9f9f7" : "#312e2b",
                      WebkitTextStroke: sq.isWhitePiece ? "0.8px rgba(60,60,55,0.9)" : "0",
                      textShadow: sq.isWhitePiece
                        ? "0 2px 3px rgba(0,0,0,0.45)"
                        : "0 1px 2px rgba(255,255,255,0.25)",
                    }}
                  >
                    {GLYPHS[sq.piece.toLowerCase()] ?? ""}
                  </span>
                )}
                {showRankLabel && (
                  <span
                    className="absolute left-[6%] top-[4%] font-semibold opacity-80"
                    style={{ fontSize: "calc(100cqw / 8 * 0.24)", color: isLight ? DARK_SQ : LIGHT_SQ }}
                  >
                    {rank}
                  </span>
                )}
                {showFileLabel && (
                  <span
                    className="absolute bottom-[2%] right-[8%] font-semibold opacity-80"
                    style={{ fontSize: "calc(100cqw / 8 * 0.24)", color: isLight ? DARK_SQ : LIGHT_SQ }}
                  >
                    {FILES[fileIdx]}
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
