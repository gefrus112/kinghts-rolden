# Kinghts Rolden — Chess Club Website

Official club hub for the **Kinghts Rolden** chess club on Chess.com:
https://www.chess.com/club/kinghts-rolden

A clean, green Next.js website that shows all club players, live games, and lets
anyone replay recent games move by move.

## Features

- **Club players** — live member list pulled from the Chess.com Public API with
  avatars, rapid ratings, online status and search.
- **Live games** — in-progress games of club members are detected automatically
  and refreshed every 60 seconds, with countdown to the next move and a link to
  watch on Chess.com.
- **Recent games viewer** — pick any member and replay their recent finished
  games move by move (PGN powered by chess.js), with autoplay, flip board,
  keyboard arrows (⬅️ ➡️) and clickable move list.
- **Join the club** — direct join link for the Chess.com club.
- **Site accounts** — visitors can create a club-site account with their
  Chess.com username (verified against the Chess.com API) or without one.
  Sessions are signed HTTP-only cookies; passwords are hashed with scrypt.

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- TanStack Query for data fetching/polling
- Prisma ORM (SQLite) for site accounts
- chess.js for PGN parsing
- Chess.com Public API (with in-memory caching + fallbacks)

## Quick start (local)

```bash
# 1. install dependencies (bun or npm/pnpm work too)
bun install

# 2. configure environment
cp .env.example .env

# 3. create the database
bun run db:push

# 4. start the dev server
bun run dev
# → http://localhost:3000
```

## How club data works

The server reads the club from the Chess.com Public API
(`api.chess.com/pub/club/kinghts-rolden`, `/members`, `/player/...`). Responses
are cached in memory for a few minutes so we stay well within the API's fair-use
policy. If the API is unreachable, the site serves the last known good data
(or a small bundled snapshot) and marks it as "Cached" in the UI.

Club config lives in `src/lib/chesscom.ts`:

```ts
export const CLUB_SLUG = "kinghts-rolden";
export const CLUB_ID = 1115308;
```

## Deploying

### Vercel (easiest)

1. Push this repo to GitHub (it already is).
2. Import the project at https://vercel.com/new.
3. Add the environment variables from `.env.example`:

   ```
   DATABASE_URL=file:./db/custom.db
   JWT_SECRET=<any long random string>
   ```

4. Deploy. Run `bun run db:push` (or `npx prisma db push`) once against your
   database before the first login.

> Note: SQLite is great for small local deployments. On serverless platforms
> the filesystem is ephemeral — if you need durable site accounts, point
> `DATABASE_URL` at a hosted Postgres provider and change the Prisma
> datasource to `postgresql`.

### VPS / Raspberry Pi

```bash
bun install
cp .env.example .env
bun run db:push
bun run build
bun run start        # serves on port 3000, put it behind nginx/caddy
```

## Static version (GitHub Pages)

This repo also keeps an earlier **pure static version** of the club site in
[`docs/`](./docs) (plain HTML/CSS/JS, no backend). GitHub Pages serves it:

1. Repo **Settings → Pages → Build and deployment**
2. Source: *Deploy from a branch* → Branch: `main`, Folder: **`/docs`**
3. Save.

> The static version shows the live club roster and a watch tab straight from
> the Chess.com API in the browser, but it cannot offer site accounts or the
> move-by-move PGN viewer — those need the Next.js app (Vercel / VPS / local).

## Not affiliated

This is a community site for the Kinghts Rolden club and is not affiliated
with or endorsed by Chess.com.
