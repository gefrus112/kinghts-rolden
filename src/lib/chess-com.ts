import { Chess } from "chess.js";
import type {
  ClubMatch,
  ClubProfile,
  GameRecord,
  MemberProfile,
} from "./types";

/* ------------------------------------------------------------------ */
/* Club constants                                                      */
/* ------------------------------------------------------------------ */

export const CLUB_SLUG = "kinghts-rolden";
export const CLUB_ID = 1115308;
export const CLUB_URL = `https://www.chess.com/club/${CLUB_SLUG}`;
export const CLUB_JOIN_URL = `https://www.chess.com/club/join/${CLUB_ID}`;
export const CLUB_INVITE_URL = `https://www.chess.com/clubs/${CLUB_ID}/members/invite`;
export const OWNER_USERNAME = "johnroddddd";

const CHESS_API = "https://api.chess.com";
const UA =
  "KnightsRoldenClubSite/1.0 (chess.com club website; github.com/gefrus112/kinghts-rolden)";

/* ------------------------------------------------------------------ */
/* Tiny in-memory TTL cache                                            */
/* ------------------------------------------------------------------ */

type CacheEntry = { expires: number; data: unknown };
const cache = new Map<string, CacheEntry>();

function cacheGet<T>(key: string): T | null {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data as T;
  if (hit) cache.delete(key);
  return null;
}

function cacheSet(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { expires: Date.now() + ttlMs, data });
}

const MIN = 60_000;

/* ------------------------------------------------------------------ */
/* Low-level fetch with User-Agent + timeout                           */
/* ------------------------------------------------------------------ */

interface RawResult {
  ok: boolean;
  status: number;
  data: unknown;
}

async function rawFetch(path: string, timeoutMs = 8000): Promise<RawResult> {
  try {
    const res = await fetch(`${CHESS_API}${path}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const data = await res.json();
    return { ok: true, status: 200, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

/** Cached JSON fetch from the chess.com Published Data API. Null if unreachable. */
async function chessApi<T>(path: string, ttlMs = 5 * MIN): Promise<T | null> {
  const hit = cacheGet<T>(path);
  if (hit !== null) return hit;
  const res = await rawFetch(path);
  if (!res.ok) return null;
  cacheSet(path, res.data, ttlMs);
  return res.data as T;
}

/* ------------------------------------------------------------------ */
/* Fallback data (real values, used when chess.com is unreachable)     */
/* ------------------------------------------------------------------ */

export const CLUB_FALLBACK: ClubProfile = {
  name: "kinghts rolden",
  clubId: CLUB_ID,
  slug: CLUB_SLUG,
  description:
    "Welcome to Knights Golden Club! 🏰\nWe are a friendly, social chess community where players gather to chat, share ideas, and enjoy the game together. To keep our club a welcoming and safe space for everyone, we ask all members to follow a few simple rules:\n",
  logo:
    "https://images.chesscomfiles.com/chess-clubs-images-prod/club-images/avatar/603a83f0-11f6-47cb-95fc-8eaa11648587.jpg",
  membersCount: 1,
  averageDailyRating: 393,
  created: 1793888105,
  lastActivity: 1793888105,
  adminUsernames: [OWNER_USERNAME],
  country: null,
  clubUrl: CLUB_URL,
  joinUrl: CLUB_JOIN_URL,
  inviteUrl: CLUB_INVITE_URL,
};

const MEMBER_FALLBACK: MemberProfile[] = [
  {
    username: OWNER_USERNAME,
    name: "Jessie Mboowa",
    avatar:
      "https://images.chesscomfiles.com/uploads/v1/user/592821486.f595830a.200x200o.c412936c7275.jpg",
    country: "US",
    isOwner: true,
    isAdmin: true,
    clubJoined: 1793888105,
    joinedChessCom: 1788962255,
    lastOnline: 1793887604,
    isOnline: false,
    ratings: { rapid: 416, blitz: 238, bullet: 326 },
  },
];

/* ------------------------------------------------------------------ */
/* Club profile + matches                                              */
/* ------------------------------------------------------------------ */

interface ChessClubRaw {
  name?: string;
  club_id?: number;
  description?: string;
  icon?: string;
  members_count?: number;
  average_daily_rating?: number;
  created?: number;
  last_activity?: number;
  admin?: string[];
  country?: string;
  url?: string;
  join_request?: string;
}

function usernameFromUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/\/pub\/player\/([A-Za-z0-9_-]+)\/?$/);
  return m ? m[1].toLowerCase() : null;
}

export async function getClub(): Promise<{ club: ClubProfile; live: boolean }> {
  const raw = await chessApi<ChessClubRaw>(`/pub/club/${CLUB_SLUG}`);
  if (!raw || !raw.name) {
    return { club: CLUB_FALLBACK, live: false };
  }
  const admins = (raw.admin ?? [])
    .map(usernameFromUrl)
    .filter((u): u is string => !!u);
  return {
    live: true,
    club: {
      name: raw.name,
      clubId: raw.club_id ?? CLUB_ID,
      slug: CLUB_SLUG,
      description: raw.description ?? "",
      logo: raw.icon ?? null,
      membersCount: raw.members_count ?? 0,
      averageDailyRating: raw.average_daily_rating ?? 0,
      created: raw.created ?? 0,
      lastActivity: raw.last_activity ?? 0,
      adminUsernames: admins,
      country: raw.country ? raw.country.split("/").pop() ?? null : null,
      clubUrl: raw.url ?? CLUB_URL,
      joinUrl: raw.join_request ?? CLUB_JOIN_URL,
      inviteUrl: CLUB_INVITE_URL,
    },
  };
}

interface ChessMatchRaw {
  name?: string;
  url?: string;
  id?: string | number;
  start_time?: number;
  time_class?: string;
  result?: string;
  team?: string;
  opponent?: string;
}

interface ClubMatchesRaw {
  finished?: ChessMatchRaw[];
  registered?: ChessMatchRaw[];
  in_progress?: ChessMatchRaw[];
}

function mapMatch(m: ChessMatchRaw, status: ClubMatch["status"]): ClubMatch {
  return {
    id: String(m.url ?? m.id ?? Math.random()),
    name: m.name ?? "Club match",
    status,
    startTime: m.start_time,
    timeClass: m.time_class,
    result: m.result,
    team: m.team,
    opponent: m.opponent,
    url: m.url ?? CLUB_URL,
  };
}

export async function getMatches(): Promise<{
  matches: ClubMatch[];
  live: boolean;
}> {
  const raw = await chessApi<ClubMatchesRaw>(
    `/pub/club/${CLUB_SLUG}/matches`,
    2 * MIN
  );
  if (!raw) {
    return { matches: [], live: false };
  }
  const matches = [
    ...(raw.in_progress ?? []).map((m) => mapMatch(m, "in_progress")),
    ...(raw.registered ?? []).map((m) => mapMatch(m, "registered")),
    ...(raw.finished ?? []).map((m) => mapMatch(m, "finished")),
  ];
  return { matches, live: true };
}

/* ------------------------------------------------------------------ */
/* Members                                                             */
/* ------------------------------------------------------------------ */

interface ClubMembersRaw {
  weekly?: { username: string; joined?: number }[];
  monthly?: { username: string; joined?: number }[];
  all_time?: { username: string; joined?: number }[];
}

export async function getClubMemberUsernames(): Promise<{
  usernames: string[];
  live: boolean;
}> {
  const raw = await chessApi<ClubMembersRaw>(
    `/pub/club/${CLUB_SLUG}/members`,
    5 * MIN
  );
  if (!raw) {
    return { usernames: MEMBER_FALLBACK.map((m) => m.username), live: false };
  }
  const seen = new Set<string>();
  const usernames: string[] = [];
  for (const list of [raw.weekly, raw.monthly, raw.all_time]) {
    for (const entry of list ?? []) {
      const u = entry.username?.toLowerCase();
      if (u && !seen.has(u)) {
        seen.add(u);
        usernames.push(u);
      }
    }
  }
  return { usernames, live: true };
}

interface PlayerRaw {
  username?: string;
  name?: string;
  avatar?: string;
  url?: string;
  country?: string;
  title?: string;
  status?: string;
  joined?: number;
  last_online?: number;
}

interface StatsRaw {
  chess_rapid?: { last?: { rating?: number } };
  chess_blitz?: { last?: { rating?: number } };
  chess_bullet?: { last?: { rating?: number } };
}

async function fetchProfile(
  username: string
): Promise<MemberProfile | null> {
  const [player, stats] = await Promise.all([
    chessApi<PlayerRaw>(`/pub/player/${username}`, 30 * MIN),
    chessApi<StatsRaw>(`/pub/player/${username}/stats`, 30 * MIN),
  ]);
  if (!player || !player.username) return null;
  return {
    username: player.username.toLowerCase(),
    name: player.name || undefined,
    avatar: player.avatar ?? null,
    country: player.country
      ? player.country.split("/").pop() ?? null
      : null,
    title: player.title,
    status: player.status,
    joinedChessCom: player.joined,
    lastOnline: player.last_online,
    isOnline: player.last_online
      ? Date.now() / 1000 - player.last_online < 600
      : false,
    ratings: stats
      ? {
          rapid: stats.chess_rapid?.last?.rating,
          blitz: stats.chess_blitz?.last?.rating,
          bullet: stats.chess_bullet?.last?.rating,
        }
      : undefined,
  };
}

export async function getMembers(): Promise<{
  members: MemberProfile[];
  live: boolean;
}> {
  const { usernames, live } = await getClubMemberUsernames();
  if (!live) return { members: MEMBER_FALLBACK, live: false };

  // Enrich up to 60 members with full profiles (chunked for politeness).
  const slice = usernames.slice(0, 60);
  const results = await Promise.all(
    slice.map((u) => fetchProfile(u).catch(() => null))
  );
  const members: MemberProfile[] = [];
  const enriched = new Set<string>();
  results.forEach((p, i) => {
    if (p) {
      enriched.add(p.username);
      members.push({
        ...p,
        clubJoined: undefined,
        isOwner: p.username === OWNER_USERNAME,
        isAdmin: p.username === OWNER_USERNAME,
      });
    } else {
      members.push({
        username: usernames[i],
        isOwner: usernames[i] === OWNER_USERNAME,
      });
    }
  });
  // Any members beyond the enrichment cap stay as plain usernames.
  for (const u of usernames.slice(60)) {
    members.push({
      username: u,
      isOwner: u === OWNER_USERNAME,
    });
  }
  return { members, live: true };
}

export async function getPlayer(
  username: string
): Promise<
  | { status: "found"; profile: MemberProfile }
  | { status: "not_found" }
  | { status: "unreachable" }
> {
  const u = username.toLowerCase();
  try {
    const res = await fetch(`${CHESS_API}/pub/player/${u}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 410) {
      return { status: "not_found" };
    }
    if (!res.ok) return { status: "unreachable" };
    const player = (await res.json()) as PlayerRaw;
    const profile = await fetchProfile(u);
    if (profile) return { status: "found", profile };
    // Had a 200 but enrichment failed – build a minimal profile.
    return {
      status: "found",
      profile: {
        username: u,
        name: player.name || undefined,
        avatar: player.avatar ?? null,
        country: player.country ? player.country.split("/").pop() : null,
        lastOnline: player.last_online,
        isOnline: player.last_online
          ? Date.now() / 1000 - player.last_online < 600
          : false,
      },
    };
  } catch {
    return { status: "unreachable" };
  }
}

/* ------------------------------------------------------------------ */
/* Recent games (for the replay theater)                               */
/* ------------------------------------------------------------------ */

const RESULT_LABELS: Record<string, string> = {
  win: "won",
  checkmated: "checkmated",
  agreed: "draw agreed",
  repetition: "draw by repetition",
  timeout: "lost on time",
  resign: "resigned",
  stalemate: "stalemate",
  lose: "lost",
  insufficient: "insufficient material",
  "50move": "50-move rule",
  abandoned: "abandoned",
  threecheck: "three-check",
  timevsinsufficient: "timeout vs insufficient",
};

export function resultLabel(code?: string): string {
  if (!code) return "";
  return RESULT_LABELS[code] ?? code;
}

interface ArchiveGameRaw {
  url?: string;
  uuid?: string;
  pgn?: string;
  time_class?: string;
  rated?: boolean;
  end_time?: number;
  white?: { username?: string; rating?: number; result?: string };
  black?: { username?: string; rating?: number; result?: string };
}

function buildGameRecord(g: ArchiveGameRaw): GameRecord | null {
  if (!g.pgn) return null;
  const chess = new Chess();
  try {
    chess.loadPgn(g.pgn);
  } catch {
    return null;
  }
  const history = chess.history();
  if (history.length === 0) return null;
  const replay = new Chess();
  const fens = [replay.fen()];
  const fromTo: string[][] = [];
  for (const san of history) {
    try {
      const mv = replay.move(san);
      if (!mv) return null;
      fromTo.push([mv.from, mv.to]);
      fens.push(replay.fen());
    } catch {
      return null;
    }
  }
  return {
    id: g.uuid ?? g.url ?? String(g.end_time ?? Math.random()),
    url: g.url ?? CLUB_URL,
    endTime: g.end_time ?? 0,
    timeClass: g.time_class ?? "rapid",
    rated: g.rated ?? true,
    white: {
      username: g.white?.username ?? "White",
      rating: g.white?.rating,
      result: resultLabel(g.white?.result),
    },
    black: {
      username: g.black?.username ?? "Black",
      rating: g.black?.rating,
      result: resultLabel(g.black?.result),
    },
    moves: history,
    fromTo,
    fens,
  };
}

export async function getRecentGames(
  username: string,
  max = 12
): Promise<{ games: GameRecord[]; live: boolean }> {
  const u = username.toLowerCase();
  const archives = await chessApi<string[]>(
    `/pub/player/${u}/games/archives`,
    10 * MIN
  );
  if (!archives || archives.length === 0) {
    return { games: demoGames(), live: false };
  }
  const months = archives.slice(-2);
  const lists = await Promise.all(
    months.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": UA, Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
          cache: "no-store",
        });
        if (!res.ok) return [];
        return (await res.json()) as ArchiveGameRaw[];
      } catch {
        return [];
      }
    })
  );
  const all = lists.flat();
  all.sort((a, b) => (b.end_time ?? 0) - (a.end_time ?? 0));
  const games: GameRecord[] = [];
  for (const g of all) {
    const rec = buildGameRecord(g);
    if (rec) games.push(rec);
    if (games.length >= max) break;
  }
  if (games.length === 0) return { games: demoGames(), live: false };
  return { games, live: true };
}

/* ------------------------------------------------------------------ */
/* Demo games (shown in offline preview while chess.com is blocked)    */
/* ------------------------------------------------------------------ */

let demoCache: GameRecord[] | null = null;

function makeDemo(
  san: string,
  meta: { id: string; white: string; black: string; title: string; url: string }
): GameRecord {
  const replay = new Chess();
  replay.loadPgn(
    `[White "${meta.white}"]\n[Black "${meta.black}"]\n[Result "1-0"]\n\n${san}`
  );
  const history = replay.history();
  const board = new Chess();
  const fens = [board.fen()];
  const fromTo: string[][] = [];
  for (const m of history) {
    const mv = board.move(m);
    fromTo.push([mv.from, mv.to]);
    fens.push(board.fen());
  }
  return {
    id: meta.id,
    url: meta.url,
    endTime: 0,
    timeClass: "casual",
    rated: false,
    white: { username: meta.white, result: "won" },
    black: { username: meta.black, result: "checkmated" },
    moves: history,
    fromTo,
    fens,
    demo: true,
    demoTitle: meta.title,
  };
}

function demoGames(): GameRecord[] {
  if (demoCache) return demoCache;
  demoCache = [
    makeDemo(
      "e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#",
      {
        id: "demo-opera",
        white: "Paul Morphy",
        black: "Duke Karl / Count Isouard",
        title: "The Opera Game — Paris, 1858",
        url: "https://www.chess.com/news/view/opera-game",
      }
    ),
    makeDemo(
      "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nf6 Qd3 e5 dxe5 Qa5+ Bd2 Qxe5 O-O-O Nxe4 Qd8+ Kxd8 Bg5+ Kc7 Bd8#",
      {
        id: "demo-reti",
        white: "Richard Réti",
        black: "Savielly Tartakower",
        title: "Réti's queen sac — Vienna, 1910",
        url: "https://www.chess.com/terms/chess-opening-reti-gambit",
      }
    ),
    makeDemo(
      "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O d3 Qb3 Qf6 e5 Qg6 Re1 Nge7 Ba3 b5 Qxb5 Rb8 Qa4 Bb6 Nbd2 Bb7 Ne4 Qf5 Bxd3 Qh5 Nf6+ gxf6 exf6 Rg8 Rad1 Qxf3 Rxe7+ Nxe7 Qxd7+ Kxd7 Bf5+ Ke8 Bd7+ Kf8 Bxe7#",
      {
        id: "demo-immortal",
        white: "Adolf Anderssen",
        black: "Lionel Kieseritzky",
        title: "The Immortal Game — London, 1851",
        url: "https://www.chess.com/terms/immortal-game-chess",
      }
    ),
  ];
  return demoCache;
}
