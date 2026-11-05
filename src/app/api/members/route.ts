import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMembers } from "@/lib/chess-com";
import type { MembersData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ members, live }, siteMembers] = await Promise.all([
    getMembers(),
    db.siteMember.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: 200,
    }),
  ]);

  const siteByUsername = new Map(siteMembers.map((s) => [s.username, s]));
  const merged = members.map((m) => {
    const site = siteByUsername.get(m.username.toLowerCase());
    return { ...m, isSiteMember: !!site };
  });

  const data: MembersData = { live, members: merged };
  return NextResponse.json(data);
}
