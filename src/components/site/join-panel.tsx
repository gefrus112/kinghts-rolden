"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CircleAlert,
  ExternalLink,
  LogOut,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MemberAvatar } from "@/components/site/members-panel";
import { CLUB_JOIN_URL } from "@/lib/constants";
import type { MemberProfile, SessionInfo } from "@/lib/types";

function flagFor(code?: string | null): string {
  if (!code || code.length !== 2) return "🌍";
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function JoinPanel({
  session,
  membersData,
  onSessionChange,
}: {
  session: SessionInfo | null;
  membersData: { members: MemberProfile[] } | null;
  onSessionChange: (s: SessionInfo | null) => void;
}) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed. Please try again.");
        return;
      }
      onSessionChange(data.session as SessionInfo);
      toast({
        title: `Welcome, ${data.session.username}!`,
        description: data.message,
      });
      setUsername("");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      onSessionChange(null);
      toast({ title: "Signed out", description: "See you at the board! ♟️" });
    }
  }

  const me = session
    ? membersData?.members.find((m) => m.username === session.username)
    : null;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Sign in / profile */}
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-emerald-950">
            <UserRoundPlus className="h-5 w-5 text-emerald-700" />
            {session ? "Your profile" : "Sign in with your Chess.com account"}
          </CardTitle>
          <CardDescription>
            {session
              ? "This is how other players see you on the site."
              : "No password needed — we check your username against the club roster using the official Chess.com API."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {me ? (
                  <MemberAvatar member={me} className="h-16 w-16 text-xl" />
                ) : session.avatarUrl ? (
                  <img
                    src={session.avatarUrl}
                    alt="Your avatar"
                    className="h-16 w-16 rounded-full border border-emerald-200 object-cover"
                  />
                ) : (
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-xl font-extrabold text-emerald-800">
                    {session.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-lg font-bold text-emerald-950">
                    {session.username}
                    {session.isClubMember ? (
                      <BadgeCheck className="h-5 w-5 text-emerald-600" />
                    ) : null}
                  </p>
                  {session.displayName && (
                    <p className="truncate text-sm text-emerald-900/60">
                      {flagFor(session.country)} {session.displayName}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {session.isClubMember ? (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        <ShieldCheck className="h-3 w-3" /> Club member
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Not in the club yet
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className={
                        session.verified
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }
                    >
                      {session.verified
                        ? "verified via Chess.com"
                        : "unverified (Chess.com unreachable)"}
                    </Badge>
                  </div>
                </div>
              </div>

              {!session.isClubMember && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-900">
                  You&apos;re signed in but not a member of{" "}
                  <span className="font-semibold">kinghts rolden</span> yet.
                  Join on chess.com, then refresh — your member badge appears
                  automatically.
                  <Button
                    asChild
                    size="sm"
                    className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <a
                      href={CLUB_JOIN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join the club on Chess.com{" "}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-emerald-200 text-emerald-800"
                >
                  Refresh status
                </Button>
                <Button
                  variant="outline"
                  onClick={signOut}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <label
                  htmlFor="cc-username"
                  className="text-sm font-semibold text-emerald-950"
                >
                  Chess.com username
                </label>
                <Input
                  id="cc-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && username && signIn()}
                  placeholder="e.g. hikaru, magnuscarlen…"
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                  autoComplete="username"
                />
                {error && (
                  <p className="flex items-start gap-1.5 text-xs text-red-600">
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </p>
                )}
              </div>
              <Button
                onClick={signIn}
                disabled={busy || username.trim().length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {busy ? "Checking chess.com…" : "Sign in with Chess.com"}
              </Button>
              <p className="text-[11px] leading-relaxed text-emerald-900/50">
                Chess.com doesn&apos;t offer public account login for club
                sites, so Knights Rolden verifies your username through the
                official Chess.com public API instead — same identity, zero
                passwords.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to join */}
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-lg text-emerald-950">
            How to join the Golden Knights
          </CardTitle>
          <CardDescription>
            Three steps — takes about a minute.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              n: 1,
              title: "Join on Chess.com",
              text: "Open the club page and press Join — this is where your membership lives.",
              href: CLUB_JOIN_URL,
              cta: "Open join page",
            },
            {
              n: 2,
              title: "Sign in here with your username",
              text: "Type your chess.com username above. We verify it live against the club roster.",
            },
            {
              n: 3,
              title: "Get your member badge",
              text: "Verified members get a badge in the players directory, and their games appear in the replay theater.",
            },
          ].map((step) => (
            <div
              key={step.n}
              className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {step.n}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-950">
                  {step.title}
                </p>
                <p className="text-xs leading-relaxed text-emerald-900/60">
                  {step.text}
                </p>
                {step.href && (
                  <Button
                    asChild
                    size="sm"
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {step.cta} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
