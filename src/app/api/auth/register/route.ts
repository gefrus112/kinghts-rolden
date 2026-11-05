import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword, setSessionCookie } from "@/lib/auth";
import { getPlayerProfile } from "@/lib/chesscom";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,25}$/;
const CHESS_USERNAME_RE = /^[a-zA-Z0-9_-]{2,30}$/;

export async function POST(req: NextRequest) {
  try {
    const existing = await getSessionUser();
    if (existing) {
      return NextResponse.json({ error: "You are already signed in" }, { status: 400 });
    }

    const body = (await req.json()) as {
      username?: string;
      password?: string;
      chessUsername?: string;
    };

    const username = body.username?.trim() || "";
    const password = body.password || "";
    const chessUsername = body.chessUsername?.trim() || "";

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-25 characters (letters, numbers, underscores)" },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (chessUsername && !CHESS_USERNAME_RE.test(chessUsername)) {
      return NextResponse.json({ error: "That Chess.com username looks invalid" }, { status: 400 });
    }

    const usernameTaken = await db.user.findUnique({ where: { username } });
    if (usernameTaken) {
      return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    }

    // Verify the Chess.com username exists (best effort — if the API is
    // unreachable we still allow the account and mark it unverified)
    let chessVerified = false;
    if (chessUsername) {
      try {
        const profile = await getPlayerProfile(chessUsername);
        if (profile?.data?.username) {
          chessVerified = true;
        } else {
          return NextResponse.json(
            { error: "Could not find a Chess.com player with that username" },
            { status: 400 },
          );
        }
      } catch {
        // API unreachable — accept without verification
        chessVerified = false;
      }
    }

    const user = await db.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        chessUsername: chessUsername || null,
      },
    });

    await setSessionCookie(user.id, user.username);

    return NextResponse.json({
      user: { id: user.id, username: user.username, chessUsername: user.chessUsername },
      chessVerified,
    });
  } catch (e) {
    console.error("[api/auth/register]", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
