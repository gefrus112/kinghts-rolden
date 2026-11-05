import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const username = body.username?.trim() || "";
    const password = body.password || "";

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { username } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    await setSessionCookie(user.id, user.username);
    return NextResponse.json({
      user: { id: user.id, username: user.username, chessUsername: user.chessUsername },
    });
  } catch (e) {
    console.error("[api/auth/login]", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
