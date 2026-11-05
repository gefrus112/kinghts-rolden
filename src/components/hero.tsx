"use client";

import { ExternalLink, Loader2, Play, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnightLogo } from "@/components/knight-logo";
import { formatDate } from "@/lib/format";
import type { ClubInfoResponse } from "@/lib/types";

interface HeroProps {
  clubInfo: ClubInfoResponse | null;
  liveCount: number;
  membersLoading: boolean;
  onWatch: () => void;
}

export function Hero({ clubInfo, liveCount, membersLoading, onWatch }: HeroProps) {
  const name = clubInfo?.name ? clubInfo.name.replace(/\b\w/g, (c) => c.toUpperCase()) : "Kinghts Rolden";

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white">
      {/* decorative watermark */}
      <div
        className="pointer-events-none absolute -right-10 -top-16 select-none text-[280px] leading-none text-white/5"
        aria-hidden="true"
      >
        {"\u265E\uFE0E"}
      </div>
      <div
        className="pointer-events-none absolute -bottom-24 left-1/3 select-none text-[220px] leading-none text-white/5"
        aria-hidden="true"
      >
        {"\u265A\uFE0E"}
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:py-20">
        <div className="flex items-center gap-4">
          <KnightLogo size={72} className="rounded-2xl" />
          {clubInfo?.icon && (
            
            <img
              src={clubInfo.icon}
              alt="Club avatar on Chess.com"
              className="h-14 w-14 rounded-xl border border-white/25 object-cover shadow-lg"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Official club hub · Chess.com
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {name}
          </h1>
          <p className="text-base leading-relaxed text-emerald-100/90 sm:text-lg">
            {clubInfo?.description
              ? clubInfo.description.replace(/\s+/g, " ").trim().slice(0, 260)
              : "A friendly, social chess community where players gather to chat, share ideas, and enjoy the game together."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            asChild
            className="bg-white font-semibold text-emerald-900 shadow-lg hover:bg-emerald-50"
          >
            <a href={clubInfo?.joinUrl || "https://www.chess.com/club/join/1115308"} target="_blank" rel="noopener noreferrer">
              Join the Club
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button
            size="lg"
            onClick={onWatch}
            className="border border-emerald-300/40 bg-emerald-700/40 font-semibold text-white backdrop-blur hover:bg-emerald-600/50"
          >
            <Play className="mr-2 h-4 w-4" />
            Watch Games
          </Button>
        </div>

        <dl className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur">
            <Users className="h-4 w-4 text-emerald-300" />
            <div className="flex flex-col">
              <dd className="text-lg font-bold leading-none">
                {membersLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  clubInfo?.membersCount ?? "—"
                )}
              </dd>
              <dt className="text-xs text-emerald-200">Members</dt>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur">
            <span className="relative flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${liveCount > 0 ? "animate-ping bg-emerald-400 opacity-60" : "bg-emerald-400/30"}`}
              />
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${liveCount > 0 ? "bg-emerald-300" : "bg-emerald-400/50"}`}
              />
            </span>
            <div className="flex flex-col">
              <dd className="text-lg font-bold leading-none">{liveCount}</dd>
              <dt className="text-xs text-emerald-200">Live games</dt>
            </div>
          </div>
          {clubInfo?.createdAt ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur">
              <div className="flex flex-col">
                <dd className="text-sm font-bold leading-tight">{formatDate(clubInfo.createdAt)}</dd>
                <dt className="text-xs text-emerald-200">Club founded</dt>
              </div>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
