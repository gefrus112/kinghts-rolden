import { NextRequest, NextResponse } from "next/server";
import {
  countryFlagFromUrl,
  getPlayerProfile,
  getPlayerRecentGames,
  getPlayerStats,
  ratingsFromStats,
} from "@/lib/chesscom";
import type { PlayerDataResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-zA-Z0-9_-]{2,30}$/;

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim();
  if (!username || !USERNAME_RE.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const [profileRes, statsRes, gamesRes] = await Promise.all([
      getPlayerProfile(username),
      getPlayerStats(username),
      getPlayerRecentGames(username, 20),
    ]);

    if (!profileRes && !gamesRes) {
      return NextResponse.json({ error: "Player not found or Chess.com API unavailable" }, { status: 404 });
    }

    const profile = profileRes?.data ?? null;
    const source: PlayerDataResponse["source"] =
      (gamesRes?.source as PlayerDataResponse["source"]) ||
      (profileRes?.source as PlayerDataResponse["source"]) ||
      "cache";

    const payload: PlayerDataResponse = {
      profile: profile
        ? {
            ...profile,
            countryFlag: countryFlagFromUrl(profile.country),
          }
        : null,
      ratings: ratingsFromStats(statsRes?.data),
      games:
        gamesRes?.games.map((g) => ({
          url: g.url,
          pgn: g.pgn,
          endTime: g.end_time,
          fen: g.fen || "",
          timeClass: g.time_class,
          rated: g.rated,
          white: g.white,
          black: g.black,
          whiteResult: g.white?.result,
          blackResult: g.black?.result,
        })) ?? [],
      source,
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/club/player]", e);
    return NextResponse.json({ error: "Failed to load player data" }, { status: 500 });
  }
}
