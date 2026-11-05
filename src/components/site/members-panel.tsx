"use client";

import { useMemo, useState } from "react";
import {
  Crown,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { KnightPiece } from "@/components/site/knight-logo";
import type { ClubData, MemberProfile } from "@/lib/types";

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export function MemberAvatar({
  member,
  className = "h-10 w-10 text-sm",
}: {
  member: MemberProfile;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (member.avatar && !failed) {
    return (
      <img
        src={member.avatar}
        alt={`${member.username} avatar`}
        className={`shrink-0 rounded-full border border-emerald-200/70 bg-emerald-50 object-cover ${className}`}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-200/70 bg-gradient-to-br from-emerald-100 to-emerald-200 font-bold text-emerald-800 ${className}`}
      aria-hidden
    >
      {initials(member.username)}
    </span>
  );
}

function RatingChip({ label, value }: { label: string; value?: number }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200/70">
      {label} {value}
    </span>
  );
}

function MemberRow({
  member,
  isMe,
  onViewGames,
}: {
  member: MemberProfile;
  isMe: boolean;
  onViewGames: (username: string) => void;
}) {
  const profileUrl = `https://www.chess.com/member/${member.username}`;
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors hover:border-emerald-100 hover:bg-emerald-50/60">
      <div className="relative">
        <MemberAvatar member={member} />
        {member.isOnline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
            title="Active recently"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-semibold text-emerald-950 hover:text-emerald-700 hover:underline"
          >
            {member.username}
          </a>
          {member.isOwner && (
            <Crown
              className="h-3.5 w-3.5 text-amber-500"
              aria-label="Club owner"
            />
          )}
          {member.isSiteMember && (
            <ShieldCheck
              className="h-3.5 w-3.5 text-emerald-600"
              aria-label="Joined via website"
            />
          )}
          {isMe && (
            <Badge className="h-4 bg-emerald-600 px-1.5 text-[9px] text-white">
              you
            </Badge>
          )}
        </div>
        {member.name && (
          <p className="truncate text-xs text-emerald-900/60">{member.name}</p>
        )}
        <div className="mt-0.5 flex flex-wrap gap-1">
          <RatingChip label="R" value={member.ratings?.rapid} />
          <RatingChip label="B" value={member.ratings?.blitz} />
          <RatingChip label="U" value={member.ratings?.bullet} />
          {member.ratings === undefined && !member.isOnline && (
            <span className="text-[10px] text-emerald-900/40">
              chess.com member
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-emerald-700/60 opacity-0 transition-opacity hover:text-emerald-700 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Watch recent games by ${member.username}`}
        onClick={() => onViewGames(member.username)}
      >
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function MembersPanel({
  clubData,
  membersData,
  session,
  onViewGames,
  onRefresh,
}: {
  clubData: ClubData | null;
  membersData: MembersData | null;
  session: { username: string } | null;
  onViewGames: (username: string) => void;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");

  const members = membersData?.members ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...members].sort((a, b) => {
      if (a.isOwner) return -1;
      if (b.isOwner) return 1;
      if (!!a.isOnline !== !!b.isOnline) return a.isOnline ? -1 : 1;
      return a.username.localeCompare(b.username);
    });
    if (!q) return list;
    return list.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        (m.name ?? "").toLowerCase().includes(q)
    );
  }, [members, query]);

  const club = clubData?.club;
  const loading = !membersData;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      {/* Club header */}
      <div className="border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
        <div className="flex items-center gap-3">
          {club?.logo ? (
            <ClubLogo src={club.logo} />
          ) : (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700">
              <KnightPiece className="h-7 w-7" fill="#fff" stroke="#065f46" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-emerald-950">
              {club?.name ?? "kinghts rolden"}
            </p>
            <p className="text-[11px] font-medium text-emerald-700/70">
              chess.com club #{club?.clubId ?? "…"}
            </p>
          </div>
          {clubData && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                clubData.live
                  ? "bg-emerald-600/10 text-emerald-700"
                  : "bg-amber-500/10 text-amber-700"
              }`}
              title={
                clubData.live
                  ? "Live data from the Chess.com API"
                  : "Chess.com is unreachable from this network — showing saved club data"
              }
            >
              {clubData.live ? "● live" : "◐ offline"}
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white p-1.5 ring-1 ring-emerald-100">
            <p className="text-sm font-bold text-emerald-900">
              {club?.membersCount ?? (loading ? "…" : members.length)}
            </p>
            <p className="text-[10px] text-emerald-900/60">members</p>
          </div>
          <div className="rounded-lg bg-white p-1.5 ring-1 ring-emerald-100">
            <p className="text-sm font-bold text-emerald-900">
              {club?.averageDailyRating ?? "…"}
            </p>
            <p className="text-[10px] text-emerald-900/60">avg rating</p>
          </div>
          <div className="rounded-lg bg-white p-1.5 ring-1 ring-emerald-100">
            <p className="text-sm font-bold text-emerald-900">
              {club ? new Date(club.created * 1000).getFullYear() : "…"}
            </p>
            <p className="text-[10px] text-emerald-900/60">founded</p>
          </div>
        </div>
      </div>

      {/* Search + refresh */}
      <div className="flex items-center gap-2 border-b border-emerald-100 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-900/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players…"
            aria-label="Search club players"
            className="h-9 border-emerald-100 pl-8 text-sm focus-visible:ring-emerald-500"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-emerald-100 text-emerald-700"
          aria-label="Refresh member list"
          onClick={onRefresh}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Player list */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-2">
          {loading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2.5 py-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <UserRound className="h-8 w-8 text-emerald-900/30" />
              <p className="text-sm text-emerald-900/60">
                No players match “{query}”.
              </p>
            </div>
          ) : (
            filtered.map((m) => (
              <MemberRow
                key={m.username}
                member={m}
                isMe={session?.username === m.username}
                onViewGames={onViewGames}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer CTA */}
      <div className="border-t border-emerald-100 bg-emerald-50/50 p-3">
        <Button
          asChild
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="sm"
        >
          <a
            href={club?.joinUrl ?? "https://www.chess.com/club/join/1115308"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join on Chess.com <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function ClubLogo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700">
        <KnightPiece className="h-7 w-7" fill="#fff" stroke="#065f46" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt="Club logo"
      className="h-11 w-11 rounded-xl border border-emerald-200/70 bg-white object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function MembersLoading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
    </div>
  );
}
