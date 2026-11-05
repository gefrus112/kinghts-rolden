"use client";

import { ExternalLink, Github, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnightMark } from "@/components/site/knight-logo";
import { CLUB_JOIN_URL, CLUB_PAGE_URL as CLUB_URL, GITHUB_REPO } from "@/lib/constants";

export function Navbar({
  hasLive,
  onJoin,
}: {
  hasLive: boolean;
  onJoin: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <KnightMark />
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-emerald-950 sm:text-lg">
              Knights Rolden
            </p>
            <p className="text-[11px] font-medium text-emerald-700/70 sm:text-xs">
              Chess.com club · Est. 2026
            </p>
          </div>
          {hasLive && (
            <span className="ml-1 hidden items-center gap-1.5 rounded-full bg-emerald-600/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
              <Radio className="h-3 w-3 animate-pulse" />
              Match live
            </span>
          )}
        </div>

        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Main">
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-emerald-900 hover:text-emerald-700 sm:inline-flex"
            asChild
          >
            <a href={CLUB_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Chess.com club
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-emerald-900 hover:text-emerald-700"
            asChild
          >
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <Button
            size="sm"
            onClick={onJoin}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Join the club
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-emerald-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-emerald-900/70 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <KnightMark className="h-7 w-7 rounded-lg" />
          <span>
            <span className="font-semibold text-emerald-950">Knights Rolden</span>{" "}
            — a friendly chess club community
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <a
            className="hover:text-emerald-700 hover:underline"
            href={CLUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Club on Chess.com
          </a>
          <a
            className="hover:text-emerald-700 hover:underline"
            href={CLUB_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the club
          </a>
          <a
            className="hover:text-emerald-700 hover:underline"
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
          >
            Source code
          </a>
          <span className="text-emerald-900/40">
            Data: Chess.com Published Data API · not affiliated with Chess.com
          </span>
        </div>
      </div>
    </footer>
  );
}
