# Knights Rolden — Chess Club Website 🏰♟️

The official website of the **kinghts rolden** club on [Chess.com](https://www.chess.com/club/kinghts-rolden) — a clean, green home for the Golden Knights community.

![Tech](https://img.shields.io/badge/Next.js%2016-React%2019-059669) ![DB](https://img.shields.io/badge/Prisma-SQLite-059669) ![Style](https://img.shields.io/badge/Tailwind%20CSS%204-shadcn%2Fui-059669)

## What's inside

- **Players directory (left panel)** — every club member fetched live from the Chess.com Published Data API: avatars, names, rapid/blitz/bullet ratings, online status, club-owner crown and "joined via site" shield badges. Searchable.
- **Club matches** — team matches pulled from Chess.com (live / scheduled / finished) with a pulsing **LIVE** badge. Chess.com doesn't allow its live boards to be embedded on other sites (X-Frame-Options), so live matches open on chess.com in one click.
- **Game replay theater** — replay any club member's recent games **move-by-move on our own green board**: game list, autoplay with speed control, flip board, clickable move list, keyboard arrows (←/→/space), last-move highlighting.
- **Sign in with Chess.com** — no passwords. Enter your Chess.com username and the site verifies it live against the club roster via the official API, then pins a member badge to your profile. (Chess.com has no public OAuth for club sites, so identity = username verification.)
- **Join flow** — clear 3-step "how to join" with the club's join link.
- **Graceful offline mode** — if the Chess.com API is unreachable from the host network, the site falls back to saved club data and historic demo games (Opera Game, Immortal Game…) so everything stays usable, clearly marked `◐ offline`.
- Auto-refresh every 60s, fully responsive (members panel becomes a **Players** tab on mobile), sticky footer, green knight branding + favicon.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui + Lucide icons |
| DB | Prisma ORM + SQLite (site member sign-ins) |
| Data | Chess.com Published Data API (server-side, cached in memory) |
| Chess logic | chess.js (PGN parsing / position replay) |

## Run it locally

```bash
# 1. install deps (bun or npm/pnpm work too)
bun install

# 2. set the database location
cp .env.example .env        # DATABASE_URL="file:./db/custom.db"

# 3. create the SQLite database
bun run db:push

# 4. start the dev server
bun run dev                 # → http://localhost:3000
```

Production build (standalone output):

```bash
bun run build
bun run start
```

## Deploying

- **Vercel / Netlify**: import the repo and deploy — the API routes and live data work out of the box. SQLite on serverless platforms is ephemeral, so member sign-ins reset per instance; everything else is unaffected.
- **Railway / Fly.io / VPS (recommended for full features)**: `bun run build && bun run start` with a persistent volume mounted at your `DATABASE_URL` path. On a VPS the Chess.com API is reachable and sign-ins persist.

No secrets are required — all Chess.com endpoints used are public.

## Project layout

```
src/
  app/
    page.tsx                  # the whole dashboard (tabs + members sidebar)
    api/club | members | games| auth/*   # data + sign-in endpoints
    icon.svg                  # knight favicon
  components/site/            # navbar, members panel, watch/replay, join, board
  lib/chess-com.ts            # Chess.com API client + cache + fallbacks
  lib/types.ts                # shared types
prisma/schema.prisma          # SiteMember model
```

## Notes & credits

- Club data © its members, via the [Chess.com Published Data API](https://www.chess.com/news/view/published-data-api). This site is a community project and is not affiliated with Chess.com.
- Knight piece artwork in the logo/favicon: *"Chess klt45"* by Colin M.L. Burnett (Wikimedia Commons, CC BY-SA 3.0).
- Want the club slug/ID changed? Edit the constants at the top of `src/lib/chess-com.ts`.
