import { NextResponse } from "next/server";
import { getClubMembers, getPlayerToMove, mapWithConcurrency } from "@/lib/chesscom";
import type { LiveGame } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCAN_LIMIT = 40;

type Cached = { data: { games: LiveGame[]; scannedMembers: number; source: string }; ts: number };
let routeCache: Cached | null = null;
const ROUTE_TTL = 45_000;

export async function GET() {
  if (routeCache && Date.now() - routeCache.ts < ROUTE_TTL) {
    return NextResponse.json(routeCache.data);
  }

  try {
    // getClubMembers() has a 10-minute cache, so this is cheap
    const membersRes = await getClubMembers();
    if (!membersRes) {
      return NextResponse.json({ games: [], scannedMembers: 0, source: "snapshot" });
    }

    const { weekly = [], monthly = [], all_time = [] } = membersRes.data || {};
    const seen = new Set<string>();
    const usernames: string[] = [];
    for (const m of [...weekly, ...monthly, ...all_time]) {
      const key = m.username.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        usernames.push(m.username);
      }
    }

    const toScan = usernames.slice(0, SCAN_LIMIT);
    const results = await mapWithConcurrency(toScan, 5, async (username) => {
      const res = await getPlayerToMove(username);
      if (!res?.data?.games?.length) return [] as LiveGame[];
      return res.data.games.map((g) => ({
        url: g.url,
        fen: g.fen || "",
        turn: (g.turn === "b" ? "b" : "w") as "w" | "b",
        moveBy: g.move_by,
        clubMember: username,
        white: g.white?.username,
        black: g.black?.username,
        whiteRating: g.white?.rating,
        blackRating: g.black?.rating,
      }));
    });

    // Dedupe by game url (both players of one game may be club members)
    const byUrl = new Map<string, LiveGame>();
    for (const games of results) {
      for (const g of games) {
        if (!g.fen) continue;
        if (!byUrl.has(g.url)) byUrl.set(g.url, g);
      }
    }

    const payload = {
      games: [...byUrl.values()],
      scannedMembers: toScan.length,
      source: membersRes.source,
    };
    routeCache = { data: payload, ts: Date.now() };
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/club/live]", e);
    if (routeCache) return NextResponse.json(routeCache.data);
    return NextResponse.json({ games: [], scannedMembers: 0, source: "cache" });
  }
}
