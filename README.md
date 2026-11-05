# ♞ Kinghts Rolden — Chess Club Website

Official website for the **Kinghts Rolden** chess.com club
([join the club here](https://www.chess.com/clubs/1115308/members/invite)).

**Live site:** https://gefrus112.github.io/kinghts-rolden/

Pure HTML + CSS + JavaScript — no frameworks, no build step, no dependencies.

## Features

- 🏰 **Club tab** — hero, live stats (players / online now / matches), club intro
- 🟩 **Left panel** — every club player, fetched live from the chess.com public API, with search and online-status dots
- 📺 **Watch tab** — club matches (in progress / open / finished), latest games by club players, and an embedded live chess TV board
- ♞ **Best Moves tab** — an interactive "Best Moves Lab": famous checkmate lines for 10-minute chess (Fool's Mate, Scholar's Mate, Légal's Mate, smothered mate, and the Opera Game). Press **▶ Play** and watch the moves appear one by one — every move has its own club name and a type badge (CHECKMATE / SACRIFICE / BLUNDER / …). Plus a 10-minute opening kit and golden rules.
- ✨ **Join tab** — one-click official club invite + chess.com username registration (verified live through the chess.com API, saved on your device)
- 🌙 **Light / dark theme** switcher (remembers your choice)

## Run locally

```bash
# any static server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just double-click `index.html` (the live chess.com data loads from your browser).

## Data

Roster, matches and games come from the public chess.com API (`api.chess.com/pub`).
The club slug is auto-detected (`kinghts-rolden`) and can be overridden in the left panel.
