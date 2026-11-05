"use client";

import { ExternalLink, LogIn } from "lucide-react";
import { KnightLogo } from "@/components/knight-logo";

interface FooterProps {
  clubUrl: string;
  joinUrl: string;
  onOpenAuth: () => void;
}

export function Footer({ clubUrl, joinUrl, onOpenAuth }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-emerald-950/20 bg-emerald-950 text-emerald-100">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <KnightLogo size={36} />
          <div>
            <p className="text-sm font-bold text-white">Kinghts Rolden</p>
            <p className="text-xs text-emerald-300">
              Community chess club · © {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <a
            href={clubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-200 transition hover:text-white"
          >
            Club on Chess.com <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-200 transition hover:text-white"
          >
            Join the club <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1 text-emerald-200 transition hover:text-white"
          >
            <LogIn className="h-3.5 w-3.5" />
            Member sign in
          </button>
        </nav>

        <p className="max-w-xs text-center text-[11px] leading-snug text-emerald-400/80 md:text-right">
          Live data from the Chess.com Public API. This is a community site and is not
          affiliated with or endorsed by Chess.com.
        </p>
      </div>
    </footer>
  );
}
