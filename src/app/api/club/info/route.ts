import { NextResponse } from "next/server";
import {
  CLUB_ID,
  CLUB_JOIN_URL,
  CLUB_PAGE_URL,
  getClubDetails,
} from "@/lib/chesscom";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_NAME = "kinghts rolden";
const FALLBACK_DESCRIPTION =
  "Welcome to the Kinghts Rolden chess club! We are a friendly, social chess community where players gather to chat, share ideas, and enjoy the game together.";

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  try {
    const res = await getClubDetails();
    if (!res) {
      return NextResponse.json({
        name: FALLBACK_NAME,
        clubId: CLUB_ID,
        description: FALLBACK_DESCRIPTION,
        icon: "",
        membersCount: 0,
        clubUrl: CLUB_PAGE_URL,
        joinUrl: CLUB_JOIN_URL,
        admin: [],
        createdAt: Date.now() / 1000,
        source: "snapshot",
      });
    }
    const c = res.data;
    return NextResponse.json({
      name: c.name || FALLBACK_NAME,
      clubId: c.club_id || CLUB_ID,
      description: c.description ? stripHtml(c.description) : FALLBACK_DESCRIPTION,
      icon: c.icon || "",
      membersCount: c.members_count ?? 0,
      clubUrl: c.url || CLUB_PAGE_URL,
      joinUrl: c.join_request || CLUB_JOIN_URL,
      admin: c.admin || [],
      createdAt: c.created || 0,
      source: res.source,
    });
  } catch (e) {
    console.error("[api/club/info]", e);
    return NextResponse.json({ error: "Failed to load club info" }, { status: 500 });
  }
}
