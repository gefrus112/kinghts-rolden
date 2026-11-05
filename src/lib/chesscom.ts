import type {
  ChessArchiveGame,
  ChessClubDetails,
  ChessClubMembers,
  ChessPlayerProfile,
  ChessStats,
  ChessToMoveGame,
  DataSource,
} from "./types";

// ---------------------------------------------------------------------------
// Chess.com Public API client
//
// Fetch strategy (in order):
//   1. Direct request (works on most hosts / local machines)
//   2. Public CORS proxies (best effort)
//   3. Z.ai SDK page_reader (used inside the Z.ai sandbox where chess.com
//      blocks datacenter IPs with a Cloudflare challenge)
//   4. Last known good cached response ("cache")
//   5. Bundled snapshot of the club ("snapshot")
//
// Every response is cached in memory with a TTL; on failure stale cache is
// served so the site keeps working during API hiccups.
// ---------------------------------------------------------------------------

export const CLUB_SLUG = "kinghts-rolden";
export const CLUB_ID = 1115308;
export const CLUB_PAGE_URL = `https://www.chess.com/club/${CLUB_SLUG}`;
export const CLUB_JOIN_URL = `https://www.chess.com/club/join/${CLUB_ID}`;

const UA =
  "KinghtsRoldenClubSite/1.0 (chess club website; github.com/gefrus112/kinghts-rolden)";

type CacheEntry = {
  data: unknown;
  ts: number;
  source: DataSource;
  ttl: number;
};

const cache = new Map<string, CacheEntry>();

function setCached(key: string, data: unknown, source: DataSource, ttl: number) {
  cache.set(key, { data, ts: Date.now(), source, ttl });
}

function isChallengeOrHtml(body: string): boolean {
  const t = body.trimStart();
  return t.startsWith("<") || t.includes("Just a moment");
}

// --- strategy 1: direct -----------------------------------------------------

async function directFetch(url: string, timeoutMs = 9000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (isChallengeOrHtml(text)) return null;
    JSON.parse(text); // must be valid JSON
    return text;
  } catch {
    return null;
  }
}

// --- strategy 2: public proxies ---------------------------------------------

const PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

async function proxyFetch(url: string): Promise<string | null> {
  for (const make of PROXIES) {
    try {
      const res = await fetch(make(url), {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (isChallengeOrHtml(text)) continue;
      JSON.parse(text);
      return text;
    } catch {
      continue;
    }
  }
  return null;
}

// --- strategy 3: Z.ai SDK page_reader ----------------------------------------

let readerAvailable: boolean | null = null;
let readerCooldownUntil = 0;
// Serialize reader calls with spacing to respect rate limits
let readerQueue: Promise<unknown> = Promise.resolve();

function queueReader<T>(fn: () => Promise<T>): Promise<T> {
  const result = readerQueue.then(fn, fn);
  readerQueue = result.then(
    () => new Promise((resolve) => setTimeout(resolve, 600)),
    () => new Promise((resolve) => setTimeout(resolve, 600)),
  );
  return result;
}

async function readerFetch(url: string): Promise<string | null> {
  if (readerAvailable === false) return null;
  if (Date.now() < readerCooldownUntil) return null;
  return queueReader(async () => {
    if (Date.now() < readerCooldownUntil) return null;
    try {
      const { default: ZAI } = await import("z-ai-web-dev-sdk");
      const zai = await ZAI.create();
      const res = await zai.functions.invoke("page_reader", { url });
      const html: string = res?.data?.html || "";
      const json = extractJson(html);
      if (json === null) {
        console.warn(
          `[chesscom] reader could not extract JSON for ${url} (html_len=${html.length})`,
        );
        return null;
      }
      return JSON.stringify(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429")) {
        // transient rate limit — pause the reader for a while, then retry
        readerCooldownUntil = Date.now() + 90_000;
        console.warn("[chesscom] reader rate-limited, cooling down for 90s");
        return null;
      }
      // permanent failure (e.g. SDK unavailable outside the sandbox)
      readerAvailable = false;
      console.warn("[chesscom] reader fallback unavailable:", msg);
      return null;
    }
  });
}

function extractJson(html: string): unknown | null {
  if (!html) return null;
  // Reader sometimes returns raw JSON directly
  try {
    return JSON.parse(html);
  } catch {
    /* fallthrough */
  }
  // Otherwise locate the JSON payload inside the HTML wrapper (usually <pre>).
  // IMPORTANT: never strip tags — JSON string values may contain HTML
  // (e.g. club descriptions), which corrupts the payload.
  const startObj = html.indexOf("{");
  const startArr = html.indexOf("[");
  const start =
    startObj < 0 ? startArr : startArr < 0 ? startObj : Math.min(startObj, startArr);
  if (start < 0) return null;
  const end = findJsonEnd(html, start);
  if (end < 0) return null;
  try {
    return JSON.parse(html.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Walks a JSON document from `start` and returns the index of its closing brace. */
function findJsonEnd(s: string, start: number): number {
  const open = s[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// --- strategy 4: bundled snapshot --------------------------------------------


let snapshotData: Record<string, { url: string; data: any }> | null = null;

async function loadSnapshot() {
  if (snapshotData) return snapshotData;
  try {
    const mod = await import("@/data/chesscom-snapshot.json");
    snapshotData = mod.default as typeof snapshotData;
  } catch (e) {
    console.warn("[chesscom] snapshot bundle unavailable:", e instanceof Error ? e.message : e);
    snapshotData = {};
  }
  return snapshotData;
}

const SNAPSHOT_KEYS: Record<string, string> = {
  [`club:${CLUB_SLUG}`]: "club",
  [`members:${CLUB_SLUG}`]: "members",
};

async function snapshotFetch<T>(cacheKey: string): Promise<T | null> {
  const snap = await loadSnapshot();
  const key = SNAPSHOT_KEYS[cacheKey];
  if (!key || !snap?.[key]) return null;
  return snap[key].data as T;
}

// --- unified fetch with fallbacks --------------------------------------------

async function pubApi<T>(cacheKey: string, url: string, ttl: number): Promise<{ data: T; source: DataSource } | null> {
  const entry = cache.get(cacheKey);
  if (entry && Date.now() - entry.ts < entry.ttl) {
    return { data: entry.data as T, source: entry.source };
  }

  const direct = await directFetch(url);
  if (direct) {
    const parsed = JSON.parse(direct);
    setCached(cacheKey, parsed, "direct", ttl);
    return { data: parsed, source: "direct" };
  }

  const proxied = await proxyFetch(url);
  if (proxied) {
    const parsed = JSON.parse(proxied);
    setCached(cacheKey, parsed, "proxy", ttl);
    return { data: parsed, source: "proxy" };
  }

  const read = await readerFetch(url);
  if (read) {
    const parsed = JSON.parse(read);
    setCached(cacheKey, parsed, "reader", ttl);
    return { data: parsed, source: "reader" };
  }

  // stale cache as last network fallback
  if (entry) return { data: entry.data as T, source: "cache" };

  // bundled snapshot
  const snap = await snapshotFetch<T>(cacheKey);
  if (snap) {
    setCached(cacheKey, snap, "snapshot", ttl);
    return { data: snap, source: "snapshot" };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

const API = "https://api.chess.com/pub";

export async function getClubDetails(): Promise<{ data: ChessClubDetails; source: DataSource } | null> {
  return pubApi<ChessClubDetails>(`club:${CLUB_SLUG}`, `${API}/club/${CLUB_SLUG}`, 15 * 60_000);
}

export async function getClubMembers(): Promise<{ data: ChessClubMembers; source: DataSource } | null> {
  return pubApi<ChessClubMembers>(`members:${CLUB_SLUG}`, `${API}/club/${CLUB_SLUG}/members`, 10 * 60_000);
}

export async function getPlayerProfile(username: string): Promise<{ data: ChessPlayerProfile; source: DataSource } | null> {
  const u = username.toLowerCase();
  return pubApi<ChessPlayerProfile>(`profile:${u}`, `${API}/player/${u}`, 10 * 60_000);
}

export async function getPlayerStats(username: string): Promise<{ data: ChessStats; source: DataSource } | null> {
  const u = username.toLowerCase();
  return pubApi<ChessStats>(`stats:${u}`, `${API}/player/${u}/stats`, 10 * 60_000);
}

export async function getPlayerToMove(username: string): Promise<{ data: { games: ChessToMoveGame[] }; source: DataSource } | null> {
  const u = username.toLowerCase();
  return pubApi<{ games: ChessToMoveGame[] }>(`tomove:${u}`, `${API}/player/${u}/games/to-move`, 60_000);
}

export async function getPlayerMonthlyGames(username: string, year: number, month: number): Promise<{ data: { games: ChessArchiveGame[] }; source: DataSource } | null> {
  const u = username.toLowerCase();
  const mm = String(month).padStart(2, "0");
  return pubApi<{ games: ChessArchiveGame[] }>(`games:${u}:${year}-${mm}`, `${API}/player/${u}/games/${year}/${mm}`, 5 * 60_000);
}

// Aggregated: recent games across current + previous month
export async function getPlayerRecentGames(username: string, limit = 20): Promise<{ games: ChessArchiveGame[]; source: DataSource } | null> {
  const now = new Date();
  const months: Array<[number, number]> = [[now.getFullYear(), now.getMonth() + 1]];
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  months.push([prev.getFullYear(), prev.getMonth() + 1]);

  let source: DataSource | null = null;
  const all: ChessArchiveGame[] = [];
  for (const [y, m] of months) {
    const res = await getPlayerMonthlyGames(username, y, m);
    if (res) {
      source = source === "cache" ? "cache" : res.source;
      all.push(...(res.data.games || []));
    }
  }
  if (!source && all.length === 0) return null;
  all.sort((a, b) => (b.end_time ?? 0) - (a.end_time ?? 0));
  return { games: all.slice(0, limit), source };
}

export function ratingsFromStats(stats: ChessStats | null | undefined) {
  return {
    rapid: stats?.chess_rapid?.last?.rating,
    blitz: stats?.chess_blitz?.last?.rating,
    bullet: stats?.chess_bullet?.last?.rating,
    daily: stats?.chess_daily?.last?.rating,
  };
}

export function countryFlagFromUrl(countryUrl?: string): string | undefined {
  if (!countryUrl) return undefined;
  const code = countryUrl.split("/").pop();
  if (!code || code.length !== 2) return undefined;
  try {
    return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  } catch {
    return undefined;
  }
}

// Run promise-returning tasks with limited concurrency
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch {
        // keep going; caller handles undefined slots
      }
    }
  });
  await Promise.all(workers);
  return results;
}
