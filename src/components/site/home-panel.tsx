"use client";

import {
  MonitorPlay,
  Eye,
  Gamepad2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UserRoundPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KnightMark, KnightPiece } from "@/components/site/knight-logo";
import { GITHUB_REPO } from "@/lib/constants";
import type { ClubData, MembersData, SessionInfo } from "@/lib/types";

export function HomePanel({
  clubData,
  membersData,
  session,
  onWatch,
  onJoin,
}: {
  clubData: ClubData | null;
  membersData: MembersData | null;
  session: SessionInfo | null;
  onWatch: () => void;
  onJoin: () => void;
}) {
  const club = clubData?.club;
  const liveMatches =
    clubData?.matches.filter((m) => m.status === "in_progress").length ?? 0;
  const finishedMatches = clubData
    ? clubData.matches.filter((m) => m.status === "finished").length
    : 0;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-6 text-white shadow-lg sm:p-9">
        <KnightPiece
          className="pointer-events-none absolute -right-6 -top-8 h-52 w-52 opacity-10 sm:h-72 sm:w-72"
          fill="#ffffff"
        />
        <KnightPiece
          className="pointer-events-none absolute bottom-[-70px] right-24 hidden h-44 w-44 opacity-5 sm:block"
          fill="#ffffff"
        />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25">
            <Sparkles className="h-3.5 w-3.5" />
            The Golden Knights&apos; home on the web
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Knights Rolden
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-emerald-50/90 sm:text-base">
            The official website of the{" "}
            <span className="font-semibold text-white">kinghts rolden</span>{" "}
            club on Chess.com. Meet the players, follow club matches as they
            happen, replay games move-by-move, and join a friendly, social
            chess community.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Button
              size="lg"
              onClick={onJoin}
              className="bg-white text-emerald-800 hover:bg-emerald-50"
            >
              <UserRoundPlus className="h-4 w-4" />
              Join / Sign in
            </Button>
            <Button
              size="lg"
              onClick={onWatch}
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Eye className="h-4 w-4" />
              Watch &amp; replay games
            </Button>
            {club && (
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/40 bg-transparent text-white hover:bg-white/20 hover:text-white"
              >
                <a
                  href={club.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Become a member <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
          {session && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Signed in as{" "}
              <span className="font-bold">{session.username}</span>
              {session.isClubMember ? " — club member ✓" : ""}
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Club statistics"
      >
        <StatCard
          icon={<Gamepad2 className="h-4 w-4" />}
          label="Club members"
          value={club ? String(club.membersCount) : "…"}
          hint={`on chess.com${membersData ? ` · ${membersData.members.length} listed here` : ""}`}
        />
        <StatCard
          icon={<Swords className="h-4 w-4" />}
          label="Matches live"
          value={clubData ? String(liveMatches) : "…"}
          hint="team matches in progress"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Matches played"
          value={clubData ? String(finishedMatches) : "…"}
          hint="finished team matches"
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Avg daily rating"
          value={club ? String(club.averageDailyRating) : "…"}
          hint="across all members"
        />
      </section>

      {/* About */}
      <Card className="border-emerald-100">
        <CardContent className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
            <KnightMark className="h-8 w-8 rounded-lg" />
            About the club
          </h2>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-emerald-900/80">
            {(club?.description ?? "")
              .split("\n")
              .filter((line) => line.trim().length > 0)
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            <p>
              Founded{" "}
              {club
                ? new Date(club.created * 1000).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "…"}
              . Anyone can join — bring your best chess manners and let&apos;s
              grow together. ♟️
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Site features">
        <FeatureCard
          icon={<Eye className="h-5 w-5" />}
          title="Players directory"
          text="Every club member in one place on the left — search, check ratings, and open anyone's chess.com profile in one click."
        />
        <FeatureCard
          icon={<MonitorPlay className="h-5 w-5" />}
          title="Watch & replay"
          text="Follow club team matches live, and replay recent games move-by-move on our own green board — no chess.com account needed."
          action={{ label: "Open the theater", onClick: onWatch }}
        />
        <FeatureCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Sign in with chess.com"
          text="Use your chess.com username to sign in. We verify it against the club roster and pin a member badge to your profile."
        />
      </section>

      {/* Links */}
      <Card className="border-emerald-100 bg-emerald-50/40">
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <span className="mr-1 text-sm font-semibold text-emerald-950">
            Useful links:
          </span>
          <Button variant="outline" size="sm" asChild className="border-emerald-200 bg-white">
            <a
              href={club?.clubUrl ?? "https://www.chess.com/club/kinghts-rolden"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Club page
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="border-emerald-200 bg-white">
            <a
              href={club?.joinUrl ?? "https://www.chess.com/club/join/1115308"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Join link
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="border-emerald-200 bg-white">
            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> GitHub repo
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-emerald-100">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-emerald-700">
          {icon}
          <p className="text-xs font-semibold uppercase tracking-wide">
            {label}
          </p>
        </div>
        <p className="mt-2 text-2xl font-extrabold text-emerald-950">{value}</p>
        <p className="mt-0.5 text-[11px] text-emerald-900/50">{hint}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <Card className="border-emerald-100 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          {icon}
        </span>
        <h3 className="mt-3 text-sm font-bold text-emerald-950">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-emerald-900/70">
          {text}
        </p>
        {action && (
          <Button
            variant="link"
            size="sm"
            className="mt-1 h-auto p-0 text-emerald-700"
            onClick={action.onClick}
          >
            {action.label} →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
