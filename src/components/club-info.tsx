"use client";

import { CalendarDays, ExternalLink, Info, ShieldCheck, Trophy, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnightLogo } from "@/components/knight-logo";
import { SourceBadge } from "@/components/source-badge";
import { formatDate } from "@/lib/format";
import type { ClubInfoResponse } from "@/lib/types";

interface ClubInfoProps {
  clubInfo: ClubInfoResponse | null;
  user: { username: string; chessUsername: string | null } | null;
  onOpenAuth: (tab: "signin" | "signup") => void;
}

const JOIN_STEPS = [
  {
    title: "Create or log in to your Chess.com account",
    body: "Kinghts Rolden lives on Chess.com — that's where all our games, events and chat happen.",
  },
  {
    title: "Tap “Join the Club” below",
    body: "You'll jump straight to the club's join page on Chess.com and your request lands with the admins.",
  },
  {
    title: "Come back and watch the games",
    body: "Once you're a member, your games appear on this site for everyone in the club to follow.",
  },
];

export function ClubInfo({ clubInfo, user, onOpenAuth }: ClubInfoProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-emerald-950">About the Club</h2>
        <SourceBadge source={clubInfo?.source} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Identity card */}
        <section className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {clubInfo?.icon ? (
              
              <img
                src={clubInfo.icon}
                alt="Club avatar on Chess.com"
                className="h-16 w-16 rounded-xl border border-emerald-100 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <KnightLogo size={64} className="rounded-xl" />
            )}
            <div className="min-w-0">
              <h3 className="truncate text-xl font-extrabold text-emerald-950">
                {clubInfo?.name ? clubInfo.name.replace(/\b\w/g, (c) => c.toUpperCase()) : "Kinghts Rolden"}
              </h3>
              <p className="text-sm text-muted-foreground">Chess.com chess club</p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-emerald-950/80">
            {clubInfo?.description?.trim() ||
              "A friendly, social chess community where players gather to chat, share ideas, and enjoy the game together."}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>
                <strong>{clubInfo?.membersCount ?? "—"}</strong> members
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              <span>Founded {formatDate(clubInfo?.createdAt)}</span>
            </div>
            {clubInfo?.admin?.length ? (
              <div className="col-span-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="min-w-0">
                  Admin:{" "}
                  {clubInfo.admin.map((a) => (
                    <a
                      key={a}
                      href={`https://www.chess.com/member/${a.split("/").pop()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {a.split("/").pop()}
                    </a>
                  ))}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700">
              <a href={clubInfo?.joinUrl || "https://www.chess.com/club/join/1115308"} target="_blank" rel="noopener noreferrer">
                <UserPlus className="mr-2 h-4 w-4" />
                Join on Chess.com
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-emerald-200 font-medium text-emerald-800"
            >
              <a href={clubInfo?.clubUrl || "https://www.chess.com/club/kinghts-rolden"} target="_blank" rel="noopener noreferrer">
                Visit club page <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </section>

        {/* How to join + site account */}
        <div className="space-y-5">
          <section className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-bold text-emerald-950">
              <Trophy className="h-5 w-5 text-emerald-600" />
              How to join
            </h3>
            <ol className="mt-3 space-y-3">
              {JOIN_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">{step.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
            <h3 className="text-base font-bold text-emerald-950">Site account</h3>
            <p className="mt-1 text-sm text-emerald-900/80">
              Create a Kinghts Rolden site account to be part of the club hub — with or without
              linking a Chess.com username. You can sign up with your Chess.com name, or just a
              username and password.
            </p>
            {user ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3 text-sm">
                <p className="font-semibold text-emerald-950">Signed in as {user.username}</p>
                <p className="text-xs text-muted-foreground">
                  {user.chessUsername
                    ? `Linked Chess.com account: ${user.chessUsername}`
                    : "No Chess.com username linked — you can set one by re-registering or ask an admin."}
                </p>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => onOpenAuth("signup")}
                  className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                >
                  Create account
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenAuth("signin")}
                  className="border-emerald-200 font-medium text-emerald-800"
                >
                  Sign in
                </Button>
              </div>
            )}
          </section>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Club data is fetched from the public Chess.com API and cached for a few minutes.
            This is a community site and is not affiliated with or endorsed by Chess.com.
          </p>
        </div>
      </div>
    </div>
  );
}
