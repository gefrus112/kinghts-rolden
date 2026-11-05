import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { SessionInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

const COOKIE = "kr_session";

export async function GET() {
  const jar = await cookies();
  const username = jar.get(COOKIE)?.value;
  if (!username) return NextResponse.json({ session: null });

  const member = await db.siteMember
    .findUnique({ where: { username } })
    .catch(() => null);

  if (!member) return NextResponse.json({ session: null });

  const session: SessionInfo = {
    username: member.username,
    displayName: member.displayName,
    avatarUrl: member.avatarUrl,
    country: member.country,
    isClubMember: member.isClubMember,
    verified: member.verified,
    since: member.createdAt.toISOString(),
  };
  return NextResponse.json({ session });
}
