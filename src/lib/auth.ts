import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SESSION_COOKIE = "kr_session";
const SESSION_TTL_S = 7 * 24 * 60 * 60; // 7 days

function getSecret(): string {
  return process.env.JWT_SECRET || "kinghts-rolden-dev-secret-change-me";
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt, zero dependencies)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ---------------------------------------------------------------------------
// Session token (compact HMAC-SHA256 signed, JWT-compatible)
// ---------------------------------------------------------------------------

type SessionPayload = { uid: string; username: string; exp: number };

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export function signSession(payload: Omit<SessionPayload, "exp">, ttlSeconds = SESSION_TTL_S): string {
  const body: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify(body));
  const sig = createHmac("sha256", getSecret()).update(`${header}.${claims}`).digest("base64url");
  return `${header}.${claims}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, claims, sig] = parts;
  const expected = createHmac("sha256", getSecret()).update(`${header}.${claims}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(claims, "base64url").toString()) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers & current user
// ---------------------------------------------------------------------------

export async function setSessionCookie(uid: string, username: string) {
  const token = signSession({ uid, username });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export interface SessionUser {
  id: string;
  username: string;
  chessUsername: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const payload = verifySession(token);
    if (!payload) return null;
    const user = await db.user.findUnique({ where: { id: payload.uid } });
    if (!user) return null;
    return { id: user.id, username: user.username, chessUsername: user.chessUsername };
  } catch {
    return null;
  }
}
