import { NextResponse } from "next/server";
import { getClub, getMatches } from "@/lib/chess-com";
import type { ClubData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ club, live }, { matches: clubMatches, live: matchesLive }] =
    await Promise.all([getClub(), getMatches()]);

  const data: ClubData = {
    live: live || matchesLive,
    club,
    matches: clubMatches,
  };
  return NextResponse.json(data);
}
