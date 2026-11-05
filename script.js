/* ============================================================
   Kinghts Rolden — club site script
   theme switch · tabs · chess.com live data · Best Moves Lab
   ============================================================ */
"use strict";

/* ---------------- helpers ---------------- */
function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]
  ));
}
function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function lsSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

/* ---------------- theme (light / dark) ---------------- */
const THEME_KEY = "rolden-theme";
const rootEl = document.documentElement;

function applyTheme(t){
  rootEl.setAttribute("data-theme", t);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
  lsSet(THEME_KEY, t);
}
applyTheme(lsGet(THEME_KEY) ||
  (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

document.getElementById("themeToggle").addEventListener("click", () => {
  applyTheme(rootEl.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

/* ---------------- tabs ---------------- */
function goto(name){
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.goto === name));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-goto]");
  if (b) goto(b.dataset.goto);
});

/* ---------------- chess.com live data ---------------- */
const API = "https://api.chess.com/pub";
const CLUB_INVITE = "https://www.chess.com/clubs/1115308/members/invite";
const SLUG_KEY = "rolden-club-slug";
const CANDIDATES = ["kinghts-rolden","golden-knights-rolden","knights-rolden","golden-knights","rolden-knights","knights-golden","golden-rolden"];

let CLUB_SLUG = lsGet(SLUG_KEY) || null;
const state = { members: [] };

async function jget(url){
  const r = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

async function resolveClub(){
  const override = (document.getElementById("slugOverride").value || "").trim();
  const order = [];
  if (override) order.push(override);
  if (CLUB_SLUG && CLUB_SLUG !== override) order.push(CLUB_SLUG);
  for (const c of CANDIDATES) if (!order.includes(c)) order.push(c);
  for (const slug of order){
    try {
      const d = await jget(`${API}/club/${slug}/members`);
      if (d && (d.all_time || d.weekly || d.monthly)){
        CLUB_SLUG = slug;
        lsSet(SLUG_KEY, slug);
        return slug;
      }
    } catch(e){ /* try next candidate */ }
  }
  return null;
}

function timeBadge(ts){
  if (!ts) return { cls: "off", label: "offline" };
  const mins = (Date.now() / 1000 - ts) / 60;
  if (mins < 10)  return { cls: "on",   label: "online now" };
  if (mins < 60)  return { cls: "on",   label: Math.round(mins) + " min ago" };
  if (mins < 1440) return { cls: "idle", label: Math.round(mins / 60) + " h ago" };
  return { cls: "off", label: Math.round(mins / 1440) + " d ago" };
}
function fmtDate(ts){
  return ts ? new Date(ts * 1000).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";
}
function fmtWhen(ts){
  return ts ? new Date(ts * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
}

/* ----- members (left panel) ----- */
const REG_KEY = "rolden-registered";
function getReg(){
  try { return JSON.parse(lsGet(REG_KEY)) || []; } catch(e){ return []; }
}
function setReg(a){ lsSet(REG_KEY, JSON.stringify(a)); }

function renderMembers(filter){
  const regSet = new Set(getReg().map(u => u.toLowerCase()));
  let list = state.members.slice();
  for (const u of getReg()){
    if (!state.members.some(m => m.username.toLowerCase() === u.toLowerCase())){
      list.push({ username: u, joined: null, last_online: null, local: true });
    }
  }
  const q = (filter || "").trim().toLowerCase();
  if (q) list = list.filter(m => m.username.toLowerCase().includes(q));

  const el = document.getElementById("membersList");
  el.innerHTML = list.length ? list.map(m => {
    const t = timeBadge(m.last_online);
    const hue = [...m.username].reduce((a,c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;
    const chip = m.local
      ? '<span class="chip gold">here</span>'
      : (regSet.has(m.username.toLowerCase()) ? '<span class="chip ok">✓ reg</span>' : "");
    return `<li class="member">
      <span class="ava" style="--h:${hue}">${esc(m.username[0].toUpperCase())}</span>
      <div class="mem-txt">
        <a href="https://www.chess.com/profile/${encodeURIComponent(m.username)}" target="_blank" rel="noopener">${esc(m.username)}</a>
        <span class="sub">${m.local ? "saved on this device" : "joined " + fmtDate(m.joined)}</span>
      </div>
      ${chip}
      <span class="status ${t.cls}" title="${esc(t.label)}"></span>
    </li>`;
  }).join("") : '<li class="muted-note">No players found.</li>';

  document.getElementById("memberCount").textContent = state.members.length || "0";
}

async function loadMembers(){
  const bar = document.getElementById("onlineBar");
  const slug = await resolveClub();
  if (!slug){
    bar.innerHTML = `⚠️ <span class="warn">chess.com API not reachable right now.</span>
      <a href="${CLUB_INVITE}" target="_blank" rel="noopener">Open the club ↗</a> or set the slug below.`;
    document.getElementById("memberCount").textContent = "?";
    return false;
  }
  try {
    const d = await jget(`${API}/club/${CLUB_SLUG}/members`);
    const seen = new Set();
    state.members = [];
    for (const key of ["all_time","weekly","monthly"]){
      for (const m of (d[key] || [])){
        if (!seen.has(m.username)){ seen.add(m.username); state.members.push(m); }
      }
    }
    state.members.sort((a,b) => (b.last_online || 0) - (a.last_online || 0));
    const online = state.members.filter(m => timeBadge(m.last_online).cls === "on").length;
    bar.textContent = `${online} online · ${state.members.length} members`;
    renderMembers(document.getElementById("memberSearch").value);
    document.getElementById("statMembers").textContent = state.members.length;
    document.getElementById("statOnline").textContent = online;
    return true;
  } catch(e){
    bar.innerHTML = '⚠️ <span class="warn">Could not load members (API hiccup). Retry by reloading.</span>';
    return false;
  }
}

/* ----- club matches ----- */
async function loadMatches(){
  const box = document.getElementById("matchesList");
  if (!CLUB_SLUG){
    box.innerHTML = `<div class="muted-note">Roster offline — <a href="${CLUB_INVITE}" target="_blank" rel="noopener">open the club on chess.com ↗</a></div>`;
    return 0;
  }
  try {
    const d = await jget(`${API}/club/${CLUB_SLUG}/matches`);
    const groups = [
      ["in_progress", "live", "▶ watch"],
      ["registered",  "reg",  "open ↗"],
      ["finished",    "fin",  "review ↗"]
    ];
    let html = "", total = 0;
    for (const [k, cls, go] of groups){
      for (const m of (d[k] || []).slice(0, 6)){
        total++;
        html += `<a class="match ${cls}" href="${esc(m.url)}" target="_blank" rel="noopener">
          <span class="m-dot"></span>
          <span class="m-body"><b>${esc(m.name)}</b>
          <span class="m-sub">${esc(m.time_class || "chess")} · ${fmtWhen(m.start_time)}</span></span>
          <span class="m-go">${go}</span></a>`;
      }
    }
    box.innerHTML = total ? html : '<div class="muted-note">No club matches yet — start one from the club page on chess.com!</div>';
    document.getElementById("matchCount").textContent = total;
    document.getElementById("statMatches").textContent = total;
    return total;
  } catch(e){
    box.innerHTML = '<div class="muted-note">Matches could not be loaded right now.</div>';
    return 0;
  }
}

/* ----- latest games by members ----- */
async function loadGames(){
  const grid = document.getElementById("gamesGrid");
  const picks = state.members.filter(m => !m.local).slice(0, 8);
  if (!picks.length){
    grid.innerHTML = '<div class="muted-note">Roster not loaded — no games to show yet.</div>';
    return;
  }
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = String(now.getUTCMonth() + 1).padStart(2, "0");
  const games = [];
  await Promise.allSettled(picks.map(async p => {
    try {
      const d = await jget(`${API}/player/${p.username}/games/${y}/${mo}`);
      for (const g of (d.games || []).slice(-4)) games.push(g);
    } catch(e){ /* player simply has no games this month */ }
  }));
  games.sort((a,b) => (b.end_time || 0) - (a.end_time || 0));
  const top = games.slice(0, 18);
  document.getElementById("gameCount").textContent = top.length;
  if (!top.length){
    grid.innerHTML = '<div class="muted-note">No games this month yet from the roster — play some 10-minute games!</div>';
    return;
  }
  const sym = r => r === "win" ? "✔"
    : ["checkmated","resigned","timeout","abandoned","lose"].includes(r) ? "✘" : "½";
  grid.innerHTML = top.map(g => `
    <a class="game" href="${esc(g.url)}" target="_blank" rel="noopener">
      <div class="g-row"><span class="pc-mini w">♔</span> ${esc(g.white.username)} <b class="${g.white.result === "win" ? "good" : ""}">${sym(g.white.result)}</b></div>
      <div class="g-row"><span class="pc-mini b">♚</span> ${esc(g.black.username)} <b class="${g.black.result === "win" ? "good" : ""}">${sym(g.black.result)}</b></div>
      <div class="g-sub"><span class="chip info">${esc(g.time_class)}</span> ${fmtWhen(g.end_time)} <span class="go">watch ↗</span></div>
    </a>`).join("");
}

/* ----- join form (chess.com username verified live) ----- */
function renderReg(){
  const box = document.getElementById("myMembers");
  const list = getReg();
  box.innerHTML = list.map(u => `
    <span class="reg-chip">♞ <a href="https://www.chess.com/profile/${encodeURIComponent(u)}" target="_blank" rel="noopener">${esc(u)}</a>
    <button data-del="${esc(u)}" title="remove">×</button></span>`).join("");
}
document.getElementById("myMembers").addEventListener("click", e => {
  const b = e.target.closest("[data-del]");
  if (!b) return;
  setReg(getReg().filter(u => u !== b.dataset.del));
  renderReg();
  renderMembers(document.getElementById("memberSearch").value);
});
document.getElementById("joinForm").addEventListener("submit", async e => {
  e.preventDefault();
  const inp = document.getElementById("joinUser");
  const st = document.getElementById("joinStatus");
  const u = inp.value.trim();
  if (!u) return;
  st.className = "join-status";
  st.innerHTML = '<span class="spin"></span> Checking with chess.com…';
  try {
    const d = await jget(`${API}/player/${encodeURIComponent(u)}`);
    const list = getReg().filter(x => x.toLowerCase() !== d.username.toLowerCase());
    list.push(d.username);
    setReg(list);
    const rating = d.blitz && d.blitz.last && d.blitz.last.rating ? ` · blitz ${d.blitz.last.rating}` : "";
    st.className = "join-status ok";
    st.textContent = `✓ @${d.username} verified on chess.com${rating} — saved on this device.`;
    const onRoster = state.members.some(m => m.username.toLowerCase() === d.username.toLowerCase());
    st.textContent += onRoster
      ? " Already on the club roster!"
      : " Not on the club roster yet — press the golden Join button above!";
    inp.value = "";
    renderReg();
    renderMembers(document.getElementById("memberSearch").value);
  } catch(err){
    st.className = "join-status err";
    st.textContent = "chess.com says that username doesn't exist (or the API is busy) — check the spelling.";
  }
});

/* ----- slug override ----- */
document.getElementById("slugSave").addEventListener("click", () => {
  const v = document.getElementById("slugOverride").value.trim();
  if (!v) return;
  lsSet(SLUG_KEY, v);
  location.reload();
});

/* ============================================================
   BEST MOVES LAB — named checkmate lines for 10-minute chess
   ============================================================ */
const GLYPH = { K:"♚", Q:"♛", R:"♜", B:"♝", N:"♞", P:"♟" };
const FILES = "abcdefgh";

function initialBoard(){
  const b = {};
  const back = ["R","N","B","Q","K","B","N","R"];
  for (let i = 0; i < 8; i++){
    b[FILES[i] + "1"] = "w" + back[i];
    b[FILES[i] + "2"] = "wP";
    b[FILES[i] + "7"] = "bP";
    b[FILES[i] + "8"] = "b" + back[i];
  }
  return b;
}
function applyMove(board, mv){
  const nb = Object.assign({}, board);
  const pc = nb[mv.from];
  if (!pc) throw new Error("no piece on " + mv.from);
  delete nb[mv.from];
  nb[mv.to] = mv.promo ? pc[0] + mv.promo : pc;
  if (pc[1] === "K" && Math.abs(mv.from.charCodeAt(0) - mv.to.charCodeAt(0)) === 2){
    const r = mv.from[1];
    if (mv.to[0] === "g"){ nb["f" + r] = nb["h" + r]; delete nb["h" + r]; }
    else if (mv.to[0] === "c"){ nb["d" + r] = nb["a" + r]; delete nb["a" + r]; }
  }
  return nb;
}

/* every move has: san · from · to · tag (type) · name (club name) · note */
const LINES = [
{
  id: "fools",
  title: "The Two-Move Trap",
  sub: "Fool's Mate · punish it, don't play it",
  blurb: "The fastest checkmate in chess. It only works if White opens like this — but in 10-minute games it happens every single day. Two loose king-side pawns and the queen ends it on move two.",
  start: null,
  moves: [
    { san:"f3",   from:"f2", to:"f3", tag:"BLUNDER",  name:"The Loose Step",    note:"This pawn move abandons the king. Black answers in the centre." },
    { san:"e5",   from:"e7", to:"e5", tag:"DEVELOP",  name:"The Golden Answer", note:"Taking the centre and opening the queen's diagonal." },
    { san:"g4",   from:"g2", to:"g4", tag:"BLUNDER",  name:"The Fatal Door",    note:"A second king-side pawn walks. The h4–e1 diagonal is now wide open." },
    { san:"Qh4#", from:"d8", to:"h4", tag:"CHECKMATE", name:"Midnight Strike",  note:"Queen slides h4–g3–f2–e1. Nothing can block, nothing can capture. Checkmate in two moves." }
  ]
},
{
  id: "scholars",
  title: "The Golden Widow",
  sub: "Scholar's Mate · attack the f7 weakness",
  blurb: "The most famous four-move trap in chess. f7 is the weakest square in Black's opening position — only the king guards it. Bring the bishop first, then the queen. (And remember: this is also how YOU lose — never ignore a queen near f7!)",
  start: null,
  moves: [
    { san:"e4",    from:"e2", to:"e4", tag:"DEVELOP",  name:"Open the Gate",    note:"Classic centre — the bishop and queen both get air." },
    { san:"e5",    from:"e7", to:"e5", tag:"DEVELOP",  name:"The Mirror",       note:"Natural, but watch the f7 square from now on." },
    { san:"Bc4",   from:"f1", to:"c4", tag:"ATTACK",   name:"The Eye on f7",    note:"The bishop stares straight at the weakest square in Black's camp." },
    { san:"Nc6",   from:"b8", to:"c6", tag:"DEVELOP",  name:"Steady Hand",      note:"A normal developing move — no alarm bells yet." },
    { san:"Qh5",   from:"d1", to:"h5", tag:"ATTACK",   name:"The Hunt Begins",  note:"Queen attacks e5 and threatens Qxf7#. Black must react right now." },
    { san:"Nf6",   from:"g8", to:"f6", tag:"BLUNDER",  name:"The Sleepwalk",    note:"Looks like it attacks the queen — but the queen has bigger plans. f7 stays undefended." },
    { san:"Qxf7#", from:"h5", to:"f7", tag:"CHECKMATE", name:"The Golden Widow", note:"Queen takes f7 with full support from the c4 bishop. King cannot take, knight cannot reach. Game over in four moves." }
  ]
},
{
  id: "legal",
  title: "The Knight's Illusion",
  sub: "Légal's Mate · when the queen is bait",
  blurb: "A 300-year-old trap that still wins 10-minute games. White lets the queen hang — and the punishment is a knight-only checkmate. If Black refuses the bait with Nxe5, White is simply a pawn up with a great position.",
  start: null,
  moves: [
    { san:"e4",    from:"e2", to:"e4", tag:"DEVELOP",   name:"Open the Gate",     note:"" },
    { san:"e5",    from:"e7", to:"e5", tag:"DEVELOP",   name:"The Mirror",        note:"" },
    { san:"Nf3",   from:"g1", to:"f3", tag:"DEVELOP",   name:"Knight Patrol",     note:"Attacking e5 immediately." },
    { san:"d6",    from:"d7", to:"d6", tag:"DEVELOP",   name:"The Quiet Slip",    note:"Solid but passive — and it blocks the bishop's best diagonal." },
    { san:"Bc4",   from:"f1", to:"c4", tag:"ATTACK",    name:"Gun Loaded",        note:"Second piece aims at the king side. The trap is set." },
    { san:"Bg4",   from:"c8", to:"g4", tag:"TRAP",      name:"The Pin Attempt",   note:"Black pins the f3 knight and starts dreaming about the queen." },
    { san:"Nc3",   from:"b1", to:"c3", tag:"DEVELOP",   name:"Third Soldier",     note:"Development with intent — d5 is the destination." },
    { san:"g6",    from:"g7", to:"g6", tag:"BLUNDER",   name:"Loose Bricks",      note:"More holes around the king. The trap is armed." },
    { san:"Nxe5!", from:"f3", to:"e5", tag:"SACRIFICE", name:"The Illusion",      note:"The queen is 'hanging'. This is the moment the trap springs." },
    { san:"Bxd1",  from:"g4", to:"d1", tag:"BLUNDER",   name:"Bait Taken",        note:"Black grabs the queen… and never gets to enjoy it." },
    { san:"Bxf7+", from:"c4", to:"f7", tag:"CHECK",     name:"First Hammer",      note:"Check! The king must walk into the net." },
    { san:"Ke7",   from:"e8", to:"e7", tag:"FORCED",    name:"One Way Street",    note:"The only legal square." },
    { san:"Nd5#",  from:"c3", to:"d5", tag:"CHECKMATE", name:"The Golden Knight", note:"Knight lands on d5 — every escape square is covered by the e5 knight and the f7 bishop. A mate with knights only, and the queen never came back." }
  ]
},
{
  id: "cage",
  title: "The Golden Cage",
  sub: "Smothered mate pattern · Qg8+!! and Nf7#",
  blurb: "The most beautiful mating pattern in chess: the king is smothered by his own army while a lone knight delivers the blow. Learn this queen-sacrifice shape — it appears in real 10-minute games far more often than you think.",
  start: { g1:"wK", d5:"wQ", h6:"wN", h8:"bK", a8:"bR", g7:"bP", h7:"bP" },
  startLabel: "Pattern position — White to play",
  moves: [
    { san:"Qg8+!", from:"d5", to:"g8", tag:"SACRIFICE", name:"The Gilded Sacrifice", note:"Queen steps into the corner 'for free'. The king cannot take — the h6 knight guards g8." },
    { san:"Rxg8",  from:"a8", to:"g8", tag:"FORCED",    name:"Cage Door Closed",     note:"The rook must capture. Black just built his own prison." },
    { san:"Nf7#",  from:"h6", to:"f7", tag:"CHECKMATE", name:"The Golden Cage",      note:"Knight to f7 — the king is smothered by his own rook and pawns. Mate." }
  ]
},
{
  id: "opera",
  title: "The Opera Game",
  sub: "Morphy, 1858 · the best 17 moves ever played",
  blurb: "Paul Morphy's masterpiece. Development, open lines and a legendary queen sacrifice. The lesson for 10-minute chess: bring EVERY piece into the attack before you strike. White's last three moves are all rook/knight shots in a row.",
  start: null,
  moves: [
    { san:"e4",     from:"e2", to:"e4", tag:"DEVELOP",   name:"Open the Gate",          note:"" },
    { san:"e5",     from:"e7", to:"e5", tag:"DEVELOP",   name:"The Mirror",             note:"" },
    { san:"Nf3",    from:"g1", to:"f3", tag:"DEVELOP",   name:"Knight Patrol",          note:"" },
    { san:"d6",     from:"d7", to:"d6", tag:"PLAN",      name:"Solid Base",             note:"The Philidor defence." },
    { san:"d4",     from:"d2", to:"d4", tag:"ATTACK",    name:"Centre Clash",           note:"Striking the centre while ahead in development." },
    { san:"Bg4",    from:"c8", to:"g4", tag:"TRAP",      name:"The Pin Attempt",        note:"Pinning the f3 knight — Morphy refutes this idea." },
    { san:"dxe5",   from:"d4", to:"e5", tag:"CAPTURE",   name:"Break the Grip",         note:"If now Bxf3, White recaptures with the queen and stands better." },
    { san:"Bxf3",   from:"g4", to:"f3", tag:"CAPTURE",   name:"Trade Down?",            note:"Black trades bishop for knight — and helps open White's queen." },
    { san:"Qxf3",   from:"d1", to:"f3", tag:"CAPTURE",   name:"Queen Awakens",          note:"Queen active at once, hitting the e5 pawn." },
    { san:"dxe5",   from:"d6", to:"e5", tag:"CAPTURE",   name:"Pawn Recovered",         note:"" },
    { san:"Bc4",    from:"f1", to:"c4", tag:"DEVELOP",   name:"Gun Loaded",             note:"Every new piece joins the attack — that is the Opera lesson." },
    { san:"Nf6",    from:"g8", to:"f6", tag:"DEVELOP",   name:"Steady Hand",            note:"This blocks the check idea… for one move." },
    { san:"Qb3",    from:"f3", to:"b3", tag:"ATTACK",    name:"Double Threat",          note:"Hitting f7 and b7 at the same time." },
    { san:"Qe7",    from:"d8", to:"e7", tag:"FORCED",    name:"Guard Duty",             note:"Black must defend f7 with the queen — she is tied down." },
    { san:"Nc3",    from:"b1", to:"c3", tag:"DEVELOP",   name:"Third Soldier",          note:"" },
    { san:"c6",     from:"c7", to:"c6", tag:"PLAN",      name:"Digging In",             note:"Black makes room for a d7 blockade, but loses time." },
    { san:"Bg5",    from:"c1", to:"g5", tag:"ATTACK",    name:"Diagonal Hammer",        note:"Fifth piece into the game. The pin on f6 hurts." },
    { san:"b5",     from:"b7", to:"b5", tag:"BLUNDER",   name:"The Gamble",             note:"Trying to kick pieces with pawn thrusts while three pieces are still asleep at home." },
    { san:"Nxb5!",  from:"c3", to:"b5", tag:"SACRIFICE", name:"The Golden Sacrifice",   note:"Morphy just takes — every Black capture opens new lines toward the king." },
    { san:"cxb5",   from:"c6", to:"b5", tag:"CAPTURE",   name:"Pawn Takes",             note:"Forced — the knight was attacked twice." },
    { san:"Bxb5+",  from:"c4", to:"b5", tag:"CHECK",     name:"Check from the Grave",   note:"The b5–e8 diagonal is wide open: check." },
    { san:"Nbd7",   from:"b8", to:"d7", tag:"FORCED",    name:"The Only Block",         note:"" },
    { san:"O-O-O",  from:"e1", to:"c1", tag:"CASTLE",    name:"Rook to the Opera",      note:"Castling WITH attack — the rook lands on the open d-file with tempo." },
    { san:"Rd8",    from:"a8", to:"d8", tag:"PLAN",      name:"Desperate Defence",      note:"" },
    { san:"Rxd7!",  from:"d1", to:"d7", tag:"SACRIFICE", name:"The Iron Dive",          note:"Rook sacrifice! Everything White owns crashes into d7." },
    { san:"Rxd7",   from:"d8", to:"d7", tag:"CAPTURE",   name:"Heavy Trade",            note:"" },
    { san:"Rd1",    from:"h1", to:"d1", tag:"ATTACK",    name:"The Last Piece Arrives", note:"THE Opera move — even the final rook joins the attack with tempo." },
    { san:"Qe6",    from:"e7", to:"e6", tag:"FORCED",    name:"Guard Duty",             note:"Defending d7 — but now the 8th rank is haunted." },
    { san:"Bxd7+",  from:"b5", to:"d7", tag:"CHECK",     name:"Second Hammer",          note:"" },
    { san:"Nxd7",   from:"f6", to:"d7", tag:"CAPTURE",   name:"Forced Trade",           note:"" },
    { san:"Qb8+!!", from:"b3", to:"b8", tag:"SACRIFICE", name:"The Immortal Offer",     note:"QUEEN SACRIFICE. The only way to break the cover — and the knight must take." },
    { san:"Nxb8",   from:"d7", to:"b8", tag:"FORCED",    name:"Bait Taken",             note:"The knight walks out of the net." },
    { san:"Rd8#",   from:"d1", to:"d8", tag:"CHECKMATE", name:"Curtain Call",           note:"Rook lands on d8, guarded by the g5 bishop. Checkmate — the opera ends." }
  ]
}
];

/* ----- board rendering ----- */
const boardEl = document.getElementById("board");
for (let r = 8; r >= 1; r--){
  for (let f = 0; f < 8; f++){
    const sq = document.createElement("div");
    sq.className = "sq " + (((f + r) % 2 === 0) ? "light" : "dark");
    sq.dataset.sq = FILES[f] + r;
    sq.dataset.file = FILES[f];
    sq.dataset.rank = r;
    boardEl.appendChild(sq);
  }
}

let curLine = 0, plies = [], ply = 0, timer = null;

function moveLabel(i){
  const mv = LINES[curLine].moves[i];
  return (i % 2 === 0 ? (i / 2 + 1) + ". " : ((i + 1) / 2) + "… ") + mv.san;
}
function setLine(i){
  stopPlay();
  curLine = i;
  const L = LINES[i];
  const start = L.start ? Object.assign({}, L.start) : initialBoard();
  plies = [start];
  for (const mv of L.moves) plies.push(applyMove(plies[plies.length - 1], mv));
  ply = 0;
  renderLinePicker();
  renderMoveList();
  renderPos();
  renderCommentary();
}
function renderPos(){
  const b = plies[ply];
  const last = ply > 0 ? LINES[curLine].moves[ply - 1] : null;
  boardEl.querySelectorAll(".sq").forEach(sq => {
    const pc = b[sq.dataset.sq];
    sq.classList.toggle("hl-from", !!last && sq.dataset.sq === last.from);
    sq.classList.toggle("hl-to", !!last && sq.dataset.sq === last.to);
    sq.innerHTML = pc ? `<span class="pc ${pc[0]}">${GLYPH[pc[1]]}</span>` : "";
  });
  document.getElementById("plyLabel").textContent =
    ply === 0 ? (LINES[curLine].startLabel || "Start position") : "After " + moveLabel(ply - 1);
}
function renderMoveList(){
  const L = LINES[curLine];
  document.getElementById("moveList").innerHTML = L.moves.map((mv, i) => `
    <button class="mv ${i === ply - 1 ? "cur" : ""}" data-ply="${i + 1}">
      <span class="mv-no">${i % 2 === 0 ? (i / 2 + 1) + "." : ((i + 1) / 2) + "…"}</span>
      <span class="mv-san">${mv.san}</span>
      <span class="chip t-${mv.tag.toLowerCase()}">${mv.tag}</span>
      <span class="mv-name">${mv.name}</span>
    </button>`).join("");
  const cur = document.querySelector(".mv.cur");
  if (cur) cur.scrollIntoView({ block: "nearest" });
}
function renderCommentary(){
  const c = document.getElementById("commentary");
  const L = LINES[curLine];
  if (ply === 0){
    c.innerHTML = `<div class="c-head"><b>${esc(L.title)}</b></div><p class="lead">${esc(L.blurb)}</p>`;
  } else {
    const mv = L.moves[ply - 1];
    c.innerHTML = `<div class="c-head"><span class="c-mv">${esc(moveLabel(ply - 1))}</span>
      <b>${esc(mv.name)}</b>
      <span class="chip t-${mv.tag.toLowerCase()}">${mv.tag}</span></div>
      <p class="lead">${esc(mv.note || "")}</p>`;
  }
}
function renderLinePicker(){
  document.getElementById("linePicker").innerHTML = LINES.map((L, i) => `
    <button class="ln ${i === curLine ? "cur" : ""}" data-line="${i}">
      <b>${L.title}</b><span>${L.sub}</span>
    </button>`).join("");
}
function gotoPly(n){
  stopPlay();
  ply = Math.max(0, Math.min(plies.length - 1, n));
  renderPos(); renderCommentary(); renderMoveList();
}
function stopPlay(){
  if (timer){ clearInterval(timer); timer = null; }
  const b = document.getElementById("btnPlay");
  b.textContent = "▶ Play";
  b.classList.remove("on");
}
function togglePlay(){
  if (timer){ stopPlay(); return; }
  if (ply >= plies.length - 1) ply = 0;
  const b = document.getElementById("btnPlay");
  b.textContent = "⏸ Pause";
  b.classList.add("on");
  renderPos(); renderCommentary(); renderMoveList();
  timer = setInterval(() => {
    if (ply >= plies.length - 1){ stopPlay(); return; }
    ply++;
    renderPos(); renderCommentary(); renderMoveList();
  }, 1600);
}
document.getElementById("btnPlay").addEventListener("click", togglePlay);
document.getElementById("btnNext").addEventListener("click", () => gotoPly(ply + 1));
document.getElementById("btnPrev").addEventListener("click", () => gotoPly(ply - 1));
document.getElementById("btnReset").addEventListener("click", () => gotoPly(0));
document.getElementById("moveList").addEventListener("click", e => {
  const b = e.target.closest("[data-ply]");
  if (b) gotoPly(+b.dataset.ply);
});
document.getElementById("linePicker").addEventListener("click", e => {
  const b = e.target.closest("[data-line]");
  if (b) setLine(+b.dataset.line);
});

/* ---------------- member search ---------------- */
document.getElementById("memberSearch").addEventListener("input", e => {
  renderMembers(e.target.value);
});

/* ---------------- init ---------------- */
renderReg();
setLine(0);
(async () => {
  const ok = await loadMembers();
  await loadMatches();
  if (ok) loadGames();
})();
