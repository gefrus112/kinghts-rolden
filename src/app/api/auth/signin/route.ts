import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getClubMemberUsernames, getPlayer } from "@/lib/chess-com";
import type { SessionInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

const COOKIE = "kr_session";

export async function POST(req: NextRequest) {
  let body: { username?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = (body.username ?? "")
    .trim()
    .replace(/^@/, "")
    .replace(/https?:\/\/(www\.)?chess\.com\/(member|profile)\//i, "")
    .replace(/\/.*$/, "");

  if (!/^[A-Za-z0-9_-]{2,30}$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "That doesn't look like a chess.com username (letters, numbers, dashes only).",
      },
      { status: 400 }
    );
  }

  const lower = username.toLowerCase();
  const [player, club] = await Promise.all([
    getPlayer(lower),
    getClubMemberUsernames(),
  ]);

  if (player.status === "not_found") {
    return NextResponse.json(
      {
        error: `No chess.com account called "${username}" was found. Double-check the spelling — usernames are case-insensitive.`,
      },
      { status: 404 }
    );
  }

  const profile =
    player.status === "found" ? player.profile : null;
  const isClubMember = club.usernames.includes(lower);
  const verified = player.status === "found";

  // Persist the site member (best effort – the site still works if DB fails).
  try {
    await db.siteMember.upsert({
      where: { username: lower },
      create: {
        username: lower,
        displayName: profile?.name ?? null,
        avatarUrl: profile?.avatar ?? null,
        country: profile?.country ?? null,
        isClubMember,
        verified,
      },
      update: {
        displayName: profile?.name ?? undefined,
        avatarUrl: profile?.avatar ?? undefined,
        country: profile?.country ?? undefined,
        isClubMember,
        verified,
        signinCount: { increment: 1 },
      },
    });
  } catch (err) {
    console.error("siteMember upsert failed", err);
  }

  const session: SessionInfo = {
    username: lower,
    displayName: profile?.name ?? null,
    avatarUrl: profile?.avatar ?? null,
    country: profile?.country ?? null,
    isClubMember,
    verified,
    since: new Date().toISOString(),
  };

  const jar = await cookies();
  jar.set(COOKIE, lower, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({
    ok: true,
    session,
    message: verified
      ? isClubMember
        ? "Welcome back to the Golden Knights! Your club membership is verified."
        : "Signed in! You're not in the club yet though — join us on chess.com to get your member badge."
      : "Signed in as unverified — chess.com could not be reached from this network, so we couldn't confirm your account yet.",
  });
}
