import { NextResponse } from "next/server";
import {
  getClubMembers,
  getPlayerProfile,
  getPlayerStats,
  mapWithConcurrency,
  ratingsFromStats,
} from "@/lib/chesscom";
import type { ChessMemberEntry, EnrichedMember } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENRICH_LIMIT = 40;

type Cached = { data: { members: EnrichedMember[]; membersCount: number; source: string }; ts: number };
let routeCache: Cached | null = null;
const ROUTE_TTL = 3 * 60_000;

function dedupeAndSort(entries: ChessMemberEntry[]): ChessMemberEntry[] {
  const seen = new Set<string>();
  const out: ChessMemberEntry[] = [];
  for (const e of entries) {
    const key = e.username.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  // recently joined first
  out.sort((a, b) => (b.joined ?? 0) - (a.joined ?? 0));
  return out;
}

export async function GET() {
  if (routeCache && Date.now() - routeCache.ts < ROUTE_TTL) {
    return NextResponse.json(routeCache.data);
  }

  try {
    const res = await getClubMembers();
    if (!res) {
      return NextResponse.json({ members: [], membersCount: 0, source: "snapshot" });
    }

    const { weekly = [], monthly = [], all_time = [] } = res.data || {};
    const merged = dedupeAndSort([...weekly, ...monthly, ...all_time]);
    const membersCount = merged.length;

    // Enrich a bounded number of members with profile + rating data
    const toEnrich = merged.slice(0, ENRICH_LIMIT);
    const enriched = await mapWithConcurrency(toEnrich, 5, async (m): Promise<EnrichedMember> => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          getPlayerProfile(m.username),
          getPlayerStats(m.username),
        ]);
        const profile = profileRes?.data;
        return {
          username: m.username,
          joined: m.joined,
          lastOnline: profile?.last_online ?? m.last_online,
          name: profile?.name,
          avatar: profile?.avatar,
          league: profile?.league,
          ratings: ratingsFromStats(statsRes?.data),
        };
      } catch {
        return { username: m.username, joined: m.joined, lastOnline: m.last_online };
      }
    });

    const rest: EnrichedMember[] = merged.slice(ENRICH_LIMIT).map((m) => ({
      username: m.username,
      joined: m.joined,
      lastOnline: m.last_online,
    }));

    const payload = {
      members: [...enriched, ...rest],
      membersCount: merged.length,
      source: res.source,
    };
    routeCache = { data: payload, ts: Date.now() };
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/club/members]", e);
    if (routeCache) return NextResponse.json(routeCache.data);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
