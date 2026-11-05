"use client";

import { useMemo } from "react";

const GLYPHS: Record<string, string> = {
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const LIGHT = "#EDEED1";
const DARK = "#779952";

type Square = { piece: string | null; color: "w" | "b" };

function parseFen(fen: string): Square[][] {
  const board: Square[][] = [];
  const rows = fen.split(" ")[0].split("/");
  for (const row of rows) {
    const line: Square[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) line.push({ piece: null, color: "w" });
      } else {
        line.push({
          piece: ch.toLowerCase(),
          color: ch === ch.toUpperCase() ? "w" : "b",
        });
      }
    }
    board.push(line);
  }
  return board; // index 0 = rank 8
}

export function ChessBoard({
  fen,
  lastMove,
  flipped = false,
  className,
}: {
  fen: string;
  lastMove?: [string, string] | null;
  flipped?: boolean;
  className?: string;
}) {
  const board = useMemo(() => parseFen(fen), [fen]);

  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = flipped ? [...FILES].reverse() : FILES;

  return (
    <div
      className={`grid grid-cols-8 grid-rows-8 overflow-hidden rounded-xl border border-emerald-900/20 shadow-md select-none ${className ?? ""}`}
      role="img"
      aria-label="Chess position"
    >
      {ranks.map((rank, ri) =>
        files.map((file, fi) => {
          const isDark = (ri + fi) % 2 === 1;
          // board[rankIndex] where rankIndex = 8 - rank
          const piece = board[8 - rank][FILES.indexOf(file)].piece;
          const pieceColor = board[8 - rank][FILES.indexOf(file)].color;
          const sq = `${file}${rank}`;
          const isLast = lastMove && (lastMove[0] === sq || lastMove[1] === sq);
          const showRank = fi === 0;
          const showFile = ri === 7;
          return (
            <div
              key={sq}
              className="relative flex items-center justify-center"
              style={{ backgroundColor: isDark ? DARK : LIGHT }}
            >
              {isLast && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: "rgba(246, 246, 105, 0.55)" }}
                  aria-hidden
                />
              )}
              {showRank && (
                <span
                  className="absolute left-0.5 top-0.5 text-[8px] font-semibold sm:text-[10px]"
                  style={{ color: isDark ? LIGHT : DARK }}
                >
                  {rank}
                </span>
              )}
              {showFile && (
                <span
                  className="absolute bottom-0 right-0.5 text-[8px] font-semibold sm:text-[10px]"
                  style={{ color: isDark ? LIGHT : DARK }}
                >
                  {file}
                </span>
              )}
              {piece && (
                <span
                  className="relative z-10 leading-none"
                  style={{
                    fontSize: "min(8.5vw, 46px)",
                    color: pieceColor === "w" ? "#ffffff" : "#2f2b27",
                    WebkitTextStroke:
                      pieceColor === "w" ? "1.1px #3a3a3a" : "0.8px #0f0d0b",
                    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.35))",
                    fontFamily:
                      '"Segoe UI Symbol","Noto Sans Symbols 2","Apple Symbols","DejaVu Sans",sans-serif',
                  }}
                  aria-label={`${pieceColor === "w" ? "white" : "black"} ${piece}`}
                >
                  {GLYPHS[piece]}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
