import { NextRequest, NextResponse } from "next/server";
import { getRecentGames } from "@/lib/chess-com";
import type { GamesData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const username = (req.nextUrl.searchParams.get("username") ?? "")
    .trim()
    .replace(/^@/, "");

  if (!/^[A-Za-z0-9_-]{2,30}$/.test(username)) {
    return NextResponse.json(
      { error: "Please provide a valid chess.com username." },
      { status: 400 }
    );
  }

  const { games, live } = await getRecentGames(username);
  const data: GamesData = { live, username: username.toLowerCase(), games };
  return NextResponse.json(data);
}
