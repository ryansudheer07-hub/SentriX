# SentriX — Complete Frontend Design Specification

> A full, implementation-level description of the SentriX web frontend as it exists today.
> Hand this whole document to a design/build tool (Manus, Bolt, v0, etc.) so it understands
> the current design, then ask it for stronger versions. A section at the end
> (**"Brief for a redesign"**) lists the hard constraints and the parts most worth improving.

---

## 0. What SentriX is

SentriX is a **Bitcoin blockchain-forensics command center** — an investigator workstation for
law-enforcement / compliance analysts (built for SIH26146, "Team ZENITH"). It ingests Bitcoin
network data and produces **address risk scores, risk alerts, transaction-graph exploration,
explainability, live activity monitoring, a traffic-correlation engine, and an in-app AI
forensic assistant**.

**Positioning / mood:** premium, restrained, "intelligence agency console." Near-black
surfaces, a single warm **gold** accent (evokes Bitcoin without being a coin cliché), thin
hairline borders, tiny uppercase tracked labels, tabular numerals, quiet motion. It should
feel *authoritative and calm*, never playful or dashboard-generic. Every animation is subtle
and every one respects `prefers-reduced-motion`.

**One screen.** The app is a single route (`/`). It opens with a full-screen boot gate, then
reveals a long scrolling dashboard. There is no client router; "navigation" = smooth-scroll to
section anchors.

---

## 1. Tech stack & hard constraints

| Concern | Choice |
|---|---|
| Framework | **Next.js 16.3.4** (App Router, Turbopack), **React 19.2.8**, TypeScript |
| Styling | **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme inline`) **plus one hand-written stylesheet** `src/app/globals.css` (~2480 lines) that holds essentially all component CSS as BEM-ish classes. Tailwind utilities are used only sparingly (mostly on `<html>/<body>`). |
| Fonts | **Inter** via `next/font/google` (CSS var `--font-inter`, `display: swap`, latin subset). Monospace is the system stack `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. |
| Graph libs | **Cytoscape.js 3.34** (interactive Graph View) and a **hand-built SVG** graph (dashboard "Bitcoin Transaction Graph"). Both are `next/dynamic({ ssr:false })` and must stay out of the initial bundle. |
| Smooth scroll | **Lenis 1.3** site-wide, mounted in `layout.tsx`. |
| Motion | **framer-motion 13** is a dependency but the shipped UI mostly uses CSS transitions/keyframes + IntersectionObserver. |
| Data | Backend is FastAPI + JWT. Frontend talks to it through a `/api/*` rewrite proxy. Auth token in `localStorage` (`sentrix.token`). Some panels are live API; some still render typed fixtures from `src/lib/dashboardData.ts`. |
| Tests | Vitest **node environment only** — no jsdom, no Testing Library. Frontend tests are pure logic (reducers, allow-lists, mappers). |

**Non-negotiables for any redesign**

- Keep the **gold-on-near-black** identity and the "command center" tone.
- Keep it a **native single-page dashboard** (boot gate → scroll), not a multi-route app.
- **Do not fabricate data.** Risk scores, addresses, txids, alerts, graph links, anomalies are
  either real (from the API) or explicitly shown as "pending backend". The AI assistant must
  never invent them.
- **Risk scale:** backend scores are `0–1`; the UI always shows **`NN/100` plus a LEVEL word**
  (`HIGH` / `MEDIUM` / `LOW`). Never render `0.87/100`.
- Heavy libs stay **lazy-loaded**; the AI panel and both graphs must not bloat first paint.
- Everything must honour **`prefers-reduced-motion`** and stay keyboard-operable.
- The chat panel and both graph canvases each own their scroll/wheel (`data-lenis-prevent`,
  `overscroll-behavior: contain`) and must not fight Lenis or page scroll.

---

## 2. Design tokens

All defined as CSS custom properties on `:root` in `globals.css`.

### 2.1 Color

| Token | Value | Role |
|---|---|---|
| `--bg` | `#050505` | page background (near-black) |
| `--panel` | `#0d0d0d` | opaque panel base |
| `--panel-soft` | `rgba(255,255,255,0.014)` | default panel fill (barely-there lift) |
| `--line` | `rgba(245,245,245,0.08)` | hairline border |
| `--line-soft` | `rgba(245,245,245,0.04)` | inner/table divider |
| `--fg` | `#f5f5f5` | primary text |
| `--muted` | `#8b8b8b` | secondary text / labels |
| `--muted-dim` | `#5f5f5f` | tertiary text / placeholders |
| `--gold` | `#d4af37` | accent base |
| `--gold-bright` | `#f5d76e` | accent hover / active / emphasis |
| `--gold-pale` | `#e6d39a` | accent on subtle surfaces (amounts) |
| `--gold-deep` | `#b8860b` | accent gradient start |
| `--danger` | `#e5484d` | critical |
| `--danger-2` | `#d94a4a` | critical text/number (slightly calmer) |
| `--ok` | `#3fb950` | healthy / low-risk / "online" |

The dashboard container itself sits on `#0a0a0a`; graph stages use dark radial gradients
(`radial-gradient(120% 120% at 50% 0%, #111014, #0b0b0c 55%, #08080a)` and a warmer
`#12100a → #080808` for the SVG graph). Text selection: `rgba(212,175,55,0.28)` on `#fff`.

**Risk → color mapping** (single source of truth, `score` is 0–100): `>=80 → high (--danger-2)`,
`>=50 → medium (--gold)`, else `low (--ok)`.

### 2.2 Typography

- Family: Inter, weights 500/600/700 in use. `-webkit-font-smoothing: antialiased`.
- **`.eyebrow`** (the signature label style, used everywhere): `10px`, weight `600`,
  `letter-spacing: 0.16em`, `text-transform: uppercase`, color `--muted`. `.eyebrow--gold` recolors to `--gold`.
- Section titles / headings: `clamp(18px, 2.4vw, 23px)`, weight 700, `letter-spacing: -0.02em`.
- Wordmark: `clamp(52px, 11vw, 92px)`, weight 700, `letter-spacing: -0.035em`, vertical gold gradient clipped to text.
- Big numbers (stats, gauge, metrics): 700, `font-variant-numeric: tabular-nums`, tight tracking.
- Body copy: `12.5px`, `line-height: 1.55–1.6`, color `--muted` for supporting text.
- Mono is used for addresses, txids, timestamps, evidence blocks, graph labels.

### 2.3 Radius, spacing, elevation

- `--radius: 16px` (panels), `--radius-lg: 22px` (the dashboard shell). Ad-hoc: 8–14px on
  controls, `999px` on pills/chips.
- Panel gaps: `14px` between dashboard rows; `12–18px` internal.
- Borders are almost always `1px solid var(--line)` — **hairlines, not heavy strokes**.
- Shadows are reserved for floating things only: FAB `0 8px 30px rgba(0,0,0,.55)`,
  AI panel `0 24px 70px rgba(0,0,0,.62)`, nav uses `backdrop-filter: blur(12px)` instead of a shadow.

### 2.4 Z-index layers

`ambient binary field 45` · `top nav 50` · `AI FAB 120` · `AI panel 121` · `boot intro 200`.
Inside the SVG graph, toolbar/key overlays are `z-index 3`.

### 2.5 Motion vocabulary

- Primary easing: `cubic-bezier(0.22, 1, 0.36, 1)` ("gentle settle") for entrances, panel open, reveals.
- Durations: micro-interactions `120–180ms`; entrances `0.7–0.9s`; wordmark `1.6s`; boot phases `650ms`.
- Named keyframes: `rise-in` (dashboard), `wordmark-in` (de-blur + tracking settle),
  `dot-pulse` (2.4s, the "live" dot), `sai-pulse` (3.4s FAB glow), `sai-blink` (1.3s typing dots),
  `coin-bob` / `coin-drop` (boot coin), `hint-pulse`, `tx-flow` (edge comet), `addr-skeleton` (shimmer).
- **`@media (prefers-reduced-motion: reduce)`** disables: wordmark/dashboard/coin/hint/status-dot
  animations, graph edge-flow, address skeleton, all `.reveal` transitions; shortens the intro.

---

## 3. Shared primitives

- **`.panel`** — `background: var(--panel-soft)`, `1px solid var(--line)`, `border-radius: var(--radius)`, `min-width: 0`. The base for every dashboard card.
- **`.btn--gold`** — the only real button style. Transparent fill, `1px solid rgba(212,175,55,.5)`,
  radius 8, `color: var(--gold-bright)`, `11px / 600 / 0.12em / uppercase`, `white-space: nowrap`.
  Hover: fill `rgba(212,175,55,.12)`, border `.8`. (Secondary/icon buttons are bespoke per component but share the muted→fg hover idiom.)
- **`.status-dot` + `.status-dot--ok`** — 6px dot, `--ok`, green glow, `dot-pulse 2.4s` (opacity 1↔0.35). The universal "live/online" indicator.
- **`.pill`** — `padding 3px 8px`, `border-radius 999px`, `1px solid currentColor`, `9px / 700 / 0.12em / uppercase`. Variants `--danger` / `--warn` (gold) / `--ok`, each with an 8%-alpha tinted fill.
- **`.eyebrow`** — see 2.2. Nearly every card starts with one (`.eyebrow--gold`) as its title.
- **Icons** (`src/components/icons.tsx`) — hand-drawn 24-grid line icons, `stroke: currentColor`,
  `stroke-width 1.6`, round caps/joins: `ShieldMark` (brand), `SearchIcon`, `GearIcon`,
  `PlusIcon`, `MinusIcon`, `ArrowUpRight`.

---

## 4. App shell & layout

```
<body> (flex column, min-h-full)
 ├─ <SmoothScroll/>                 // Lenis, no DOM
 ├─ BinaryField variant="ambient"   // fixed full-screen canvas, opacity .16, z 45
 ├─ SiteIntro                       // full-screen boot gate, z 200 (until dismissed)
 └─ AuthGate
      ├─ (anon)  → LoginScreen
      └─ (authed)→ SentrixContextProvider
                    ├─ TopNav                    // sticky, z 50, h 56
                    ├─ <main class="page">
                    │    └─ <div class="dashboard">   // the scrolling column
                    │         Reveal(id=overview)        DashboardHeader
                    │         Reveal(delay 60)           StatGrid
                    │         Reveal(delay 120,id=risk-overview)  [ RiskOverview | TransactionGraph ]   (--split)
                    │         Reveal(id=alerts)          [ RiskAlerts | Explainability ]                (--pair)
                    │         Reveal(id=activity)        LiveActivityTable
                    │         Reveal                     GraphView (id=graph-view on its <section>)
                    │
                    └─ SentrixAIMount   // lazy: floating ₿ FAB + chat panel, z 120/121
```

- **`.dashboard`** — `width: min(1180px, calc(100% - 40px))`, centered, vertical margins
  `clamp(28px,7vh,72px)` / `clamp(64px,16vh,150px)`, padding `clamp(14px,2vw,22px)`,
  `background: #0a0a0a`, `1px solid var(--line)`, `border-radius: 22px`. One-time `rise-in` entrance.
- Rows are CSS grid: **`--split`** = `minmax(230px,290px) 1fr`, **`--pair`** = `0.82fr 1.18fr`.
  Both collapse to a single column `@max-width: 900px`.
- `scroll-margin-top: 74px` on all six section ids so AI-driven scrolls clear the sticky nav.

---

## 5. Screen-by-screen

### 5.1 Boot intro — `SiteIntro` (+ `BinaryField`, `SentrixWordmark`, `BitcoinMedallion`)

Full-screen black overlay (`position: fixed; inset: 0; z-index: 200`), **server-rendered so it is
the first paint** (no dashboard flash). Page scroll is locked (`body.overflow = hidden`) until it finishes.

Contents, centered:
1. **`BinaryField variant="intro"`** — a `<canvas>` of `0`/`1` glyphs on a 22px grid, font 13px,
   `pointer-events: none`, opacity 0.2. ~2.2% of cells flip value every 7 frames (live-code
   feel). The pointer lights up cells within an 84px radius (gold `#d4af37` → hot
   `#f6e096`) and leaves a **decaying trail** (`~0.6s`), segment-stamped so fast moves don't gap.
   Static under reduced-motion. DPR-capped at 2×, re-lays out on resize (debounced 150ms).
2. **`SentrixWordmark`** — the word "Sentrix", `clamp(52–92px)`, weight 700, vertical gold
   gradient (`#fbe8a9 → #f5d76e 44% → #d7b349`) clipped to text, `drop-shadow(0 8px 44px rgba(212,175,55,.28))`.
   Entrance `wordmark-in 1.6s` (rise 26px + de-blur 16px + tracking `0.12em → -0.035em`).
3. **`BitcoinMedallion`** at 96px inside a bare `<button aria-label="Enter Sentrix">` — a polished
   gold disc (radial `#fff4d0 → #d4af37 → #8f6b1c`), dark `₿` glyph `#1c1503`, soft outer glow,
   specular arc. Idle: `coin-bob 3.4s` (±8px float). Hover: `scale 1.06` + brightness. Focus-visible:
   gold `drop-shadow`.
4. Eyebrow: **"Blockchain Forensics · Investigator Workstation"** — `11px / 600 / 0.28em / uppercase`, `--muted-dim`.
5. Hint: **"Click the coin to enter"** — `10px / 600 / 0.22em / uppercase`, `--gold`, `hint-pulse 2.6s` (opacity 0.38↔0.72).

**Dismissal sequence:** click coin → phase `dropping` (coin `coin-drop 1000ms` falls off-screen
rotating 230°, everything else fades) → after 650ms phase `leaving` (whole overlay: `opacity 0`,
`scale 1.04`, `blur 6px`, 650ms; 340ms under reduced-motion) → phase `done` → component unmounts,
scroll unlocks. Idempotent (a ref guards double-trigger).

### 5.2 Ambient field (dashboard) — `BinaryField variant="ambient"`

Same canvas engine, **fixed full-viewport**, `z-index: 45`, `opacity: 0.16`, **no cursor
tracking** — just ~1% of cells flipping every 11 frames. It's texture, never interactive
(`pointer-events: none`, `aria-hidden`). Static under reduced-motion.

### 5.3 Login — `LoginScreen` (shown by `AuthGate` when `status === "anon"`)

- `.login` centers a `max-width: 380px` column, `min-height: 100svh`, above the ambient field.
- Static wordmark (`as="div"`, no animation) + the same eyebrow as the boot gate.
- **`.login__card`** — `background: rgba(13,13,13,.9)`, `1px solid var(--line)`, `border-radius: 16px`,
  `backdrop-filter: blur(6px)`, padding 22, gap 12, left-aligned. Contains:
  - `.eyebrow--gold` "Secure Sign-in".
  - Username + Password fields: each is a `<label>` with an `.eyebrow` caption over an input
    (`padding: 9px 11px`, `background: #0c0c0c`, `1px solid var(--line)`, radius 8, 13px;
    `:focus-visible` → border `rgba(212,175,55,.55)`, no outline).
  - Error line (`role="alert"`, `12px`, `--danger-2`) when auth fails.
  - Submit: `.btn--gold` full-width, centered; label toggles **"Sign in" / "Signing in…"**, disabled while busy (opacity .55).
  - **Demo accounts** block (top hairline): "Demo accounts" eyebrow + three chips
    **analyst / investigator / admin** — clicking a chip fills the username+password inputs
    (creds: `analyst1/analyst123`, `investigator1/investigate123`, `admin/admin123`).
- Transient boot state before auth resolves: `.auth-boot` — centered "Authenticating…",
  `12px / 0.16em / uppercase`, `--muted`, `min-height: 60vh`, `aria-busy`.

### 5.4 Top navigation — `TopNav`

`position: sticky; top: 0; z-index: 50; height: 56px`, `background: rgba(5,5,5,.82)`,
`backdrop-filter: blur(12px)`, `border-bottom: 1px solid var(--line)`, `padding: 0 clamp(16px,3vw,30px)`.
Three zones:

- **Brand** — a 26×26 gold-gradient rounded-square badge (`linear-gradient(180deg,#f5d76e,#b8860b)`,
  icon color `#1c1503`) holding `ShieldMark`, then "Sentrix" at `17px / 700`, `--gold-bright`.
- **Primary nav** (`.topnav__links`, `aria-label="Primary"`) — text links `13px`, `--muted`,
  hover `--fg`, active `--gold-bright` + `aria-current="page"`. Items: **Overview** (active),
  Network Intelligence, Address Investigation, Transactions, Risk Analysis, Monitoring, Reports.
  **Hidden `@max-width: 1000px`** (no hamburger yet — a redesign opportunity).
- **Operator** — user chip `{username}` `·` `{role}` (`11px / 700 / uppercase`, name gold, role
  `--muted`; hidden `@max-width: 640px`), a **"Sign out"** button (`padding 4px 10px`, `1px solid
  var(--line)`, radius 7, `10px / 700 / uppercase`), and a gear icon button (`--muted` → `--gold` on hover).

### 5.5 Dashboard header — `DashboardHeader`

`.dash-header` — flex, space-between, wraps, `border-bottom: 1px solid var(--line)`, `padding: 4px 4px 16px`.

- **Titles:** `.eyebrow--gold` "Sentrix Intelligence" · `<h2>` **"Bitcoin Network Forensics & Risk
  Intelligence"** (`clamp(18–23px) / 700 / -0.02em`) · status row = `status-dot--ok` + **"Live
  Monitoring"** (`10px / 600 / 0.16em / uppercase`, `--ok`).
- **Search** (`role="search"`, `.dash-search`) — `flex: 1 1 400px`, `max-width: 540px`,
  `background: #0c0c0c`, `1px solid var(--line)`, radius 10, `padding: 6px 6px 6px 12px`.
  `SearchIcon` (15, `--muted`) + a transparent input (`12.5px`, placeholder `--muted-dim`:
  **"Search address, transaction hash, or ask Sentrix…"**) + an **"Investigate"** `.btn--gold`.
  *(Currently visual only — not wired.)*

### 5.6 Stat grid — `StatGrid`

`.stat-grid` — CSS grid, **4 columns**, gap 12. → **2 cols `@820px`**, **1 col `@460px`**.

Each **`.stat-cell`** — `padding: 16`, `background: var(--panel-soft)`, `1px solid var(--line)`,
`border-radius: 12px`. Layout: big **value** (`clamp(24–32px) / 700`, tabular) → `.eyebrow` **label**
→ **delta** line (`11px / 500`, `--gold`). A `--danger` cell recolors value + delta to `--danger-2`
and tints the border/fill red (`rgba(229,72,77,.28)` / `.045`).

Fixture content (`src/lib/dashboardData.ts`):

| value | label | delta | tone |
|---|---|---|---|
| `7.8M` | Transactions Analyzed | ↑ 8.3% this week | gold |
| `18` | Active Investigations | 6 requiring review | gold |
| `312` | High-Risk Addresses | + 28 newly flagged | **danger** |
| `24,891` | Addresses Monitored | ↑ 14.8% this week | gold |

### 5.7 Risk Overview — `RiskOverview` (+ `RiskGauge`)

`.panel.risk-overview` — column, centered, `padding: 44px 20px 24px`. `.eyebrow--gold` "Risk
Overview" is **absolutely pinned top-left (18/18)**.

- **`RiskGauge`** — a 168px SVG ring (viewBox 120, radius 52). Track arc `rgba(245,215,110,.16)`
  `stroke-width 4`; progress arc `#f5d76e`, `stroke-linecap: round`, `rotate(-90)`,
  `dash = value% of circumference`, drawn twice (a blurred `feGaussianBlur stdDeviation 4.2` glow
  layer + a crisp layer). `aria-label="Risk score {n} of 100"`.
- **Readout overlay** (absolutely centered in the ring): score **`87`** at `40px / 700`,
  `--gold-bright`, tabular; `.eyebrow` "Risk Score" beneath.
- **Band:** `12px / 700 / 0.14em / uppercase`, `--danger-2` — **"HIGH RISK"**.
- **Note:** `12.5px`, `line-height 1.6`, `--muted`, `max-width: 34ch` — "Multiple indicators
  detected across transaction behavior and network activity."

### 5.8 Bitcoin Transaction Graph — `TransactionGraph` (hand-built SVG, dashboard)

`.panel.tx-graph` — column, gap 12, `padding: 18`.

- **Head:** `.eyebrow--gold` "Bitcoin Transaction Graph" + `.eyebrow` "Entity Paths · Last 24h" (`--muted-dim`).
- **Legend row:** `9px / 600 / 0.14em / uppercase`, `--muted`; items joined by a 24px horizontal
  gradient dash. Labels: Source · Intermediate · Mixer · Exchange · High-Risk Address.
- **Canvas** `.tx-graph__canvas` — `height: clamp(280px, 40vh, 360px)`, `1px solid var(--line)`,
  radius 14, `overflow: hidden`, `background: radial-gradient(120% 120% at 50% 0%, #12100a, #0b0b0b 55%, #080808)`.
  - **Toolbar** (top-left, floating chrome: `rgba(10,10,10,.82)` + `blur(6px)`, `1px solid var(--line)`,
    radius 8): `＋` Zoom in · `－` Zoom out · **Fit** · **Reset**. Buttons `9px / 700 / uppercase`,
    `--muted` → `--fg`; disabled at zoom limits.
  - **Key** (top-right, same chrome): colored dots High (`--danger-2`) / Medium (`--gold`) / Low (`--ok`).
  - **`<svg>`** viewBox `0 0 1000 470`, `preserveAspectRatio xMidYMid meet`, `touch-action: none`,
    `cursor: grab`, `data-lenis-prevent`, `role="img"`. A faint 42px grid `<pattern>` fills the bg.
  - **Layout:** a layered-DAG placement (`layoutLayeredDag`) spreads nodes across an inner box
    `x∈[96,904], y∈[122,348]`. A single `<g transform="translate(tx ty) scale(s)">` carries pan+zoom.
  - **Nodes** (`g.tx-node`, class `--high|--medium|--low` sets `color`), r = 32 (high) / 27:
    `halo` (currentColor, opacity 0 → .15 on hover/select/focus), `arc-track` ring
    (`rgba(255,255,255,.09)`, sw 3), **score arc** (currentColor, sw 3, `dash = score% of ring`,
    `rotate(-90)`), **disc** (per-level radial gradient `#tx-disc-high/medium/low`; selected → white
    2px stroke; hover → brightness 1.12), **entity glyph** in white 1.6 stroke (downward arrow =
    source, wave = mixer, arrows = exchange, warning triangle = high-risk, dot = default),
    **label** (`12px / 700`, `--fg`) + **type** caption (`8.5px / 600 / 0.16em / uppercase`, `--muted`).
  - **Edges** (`g.tx-graph__edge`, `--gold|--danger|--faint`): cubic-bezier path between rims,
    base stroke tinted by tone, `stroke-width = 2 + clamp(√flow · 1.05, 0, 6)`, tone-matched
    arrowhead marker. When a node is active: incident edges get `.is-hot` (brighter), the rest
    `.is-dim` (`opacity .14`).
  - **Flow animation** (turns on one frame after mount unless reduced-motion): a dashed "comet"
    overlay (`tx-flow 1.1s linear infinite`, `stroke-dasharray 1.5 13`) **plus** an
    `<animateMotion>` particle traveling the path, `dur = clamp(6 − flow·0.22, 2.6, 5)s`, fill
    `#fff8e6` (danger edges `#ffd0d0`).
  - **Tooltip** (`.tx-node__tip`, above the active node): dark rounded rect `rgba(12,12,14,.95)`,
    gold `8px / 700 / uppercase` title (entity), two `--fg` meta lines — "Risk {score} · {level}"
    and "{inDeg} in · {outDeg} out".
  - **Interaction model:** hover → highlight node + neighbourhood, dim rest. Click → toggle a
    sticky selection (click background to clear). Drag background → pan. **Non-passive wheel**
    zooms anchored on the cursor (`scale 0.6–2.6`, ×1.12/notch); a horizontally-dominant wheel is
    ignored so the page can still scroll. Nodes are `role="button" tabIndex=0`; Enter/Space toggles.
  - Fixture nodes: SOURCE (medium 51), INTERMEDIATE (low 28), MIXER (medium 74), EXCHANGE (low 17),
    HIGH RISK (high 95). Edges: source→intermediate (faint), source→mixer (gold, flow 12.4),
    mixer→exchange (faint), mixer→highrisk (danger, flow 8.3).

### 5.9 Recent Risk Alerts — `RiskAlerts` (**live**, `GET /api/alerts`, top 6)

`.panel.risk-alerts` — column, gap 12, `padding: 18`. `.eyebrow--gold` "Recent Risk Alerts".

- **Row** (`.risk-alerts__row`, flex-wrap, `12px / line-height 1.4`), tone by level:
  `CRITICAL → --danger-2` row, `HIGH → --gold`, `MEDIUM → --muted`. Content, `·`-separated:
  **LEVEL** (`700 / 0.08em`) · **address** (tabular) · **reason** · **"SCORE {n}"** (`600`).
- **States:** `"Loading alerts…"` · `"Couldn't load alerts. [Retry]"` (retry = underlined gold
  text button) · `"No addresses above the alert threshold."` (empty) · list (loaded).

### 5.10 Explainability — `Explainability` (fixtures) — `id="explainability"`

`.panel.explain` — column, gap 12, `padding: 18`. `.eyebrow--gold` "Explainability".

- **Question** (`.explain__question`, `14px / 600`, `--fg`): "Why is this address high risk?"
- **Factor rows** (`.explain__row`): a fixed **label** column (`width: 178px`, `--gold`;
  `118px @560px`) + a **track** (`flex`, `height: 3px`, radius 2, `background: rgba(245,245,245,.08)`)
  whose **fill** is `linear-gradient(90deg, var(--gold-deep), var(--gold-bright))` at `width: {weight}%`
  + a right-aligned **weight** (`34px`, `--gold`, tabular).
- Factors: Transaction Graph Analysis **38%** · Network Behavior **24%** · Address Clustering
  **21%** · Historical Risk Signals **17%**.

### 5.11 Live Transaction Activity — `LiveActivityTable` (fixtures)

`.panel.activity` — column, gap 14, `padding: 18`.

- **Head:** `.eyebrow--gold` "Live Transaction Activity" + `.activity__pulse` = `status-dot--ok`
  + "Refreshing in Real Time" (`9px / 600 / 0.16em / uppercase`, `--ok`).
- **Table** wrapped in `.activity__scroll` (`overflow-x: auto`); `min-width: 640px`, `12px`.
  `<th>` = `9px / 0.16em / uppercase`, `--muted-dim`, bottom hairline. `<td>` = `padding 11px 14px 11px 0`,
  bottom `--line-soft`, `white-space: nowrap`, mono where relevant.
- Columns: **Time · Transaction · Amount** (`--gold-pale`) **· From · To · Risk** (`700`, tabular;
  `>=90 → --danger-2`, `>=50 → --gold`, else `--ok`) **· Status** (`.pill`: FLAGGED→danger,
  REVIEW→warn, CLEARED→ok).
- Fixture rows: `14:42:19 · b2c1…9e3f · 3.847 BTC · bc1q…2j8k → 3F9…Q81 · 97 · FLAGGED` ·
  `14:40:02 · 6d1a…42bc · 0.912 BTC · 1A7…K92 → bc1q…8x92 · 71 · REVIEW` ·
  `14:37:46 · ae89…11c4 · 12.400 BTC · 3F9…Q81 → EXCH…104 · 22 · CLEARED`.
- **Footer:** "Try:" + three quoted suggested queries (`·`-separated), `11px`, `--muted-dim`:
  "Show high-risk addresses connected to this wallet" · "Trace the flow of funds from this
  address" · "Find addresses associated with mixer activity".

### 5.12 Graph View — `GraphView` (**live**, Cytoscape) — `<section id="graph-view">`

`.panel.graph-view` — column, gap 14, `padding: 18`. Head: `.eyebrow--gold` "Transaction Graph"
+ `.eyebrow` "Address flow · risk-weighted" (`--muted-dim`).

**Controls** — `GraphControls`, `.graph-controls` (flex-wrap, gap `10px 16px`):

- **Risk segment** — a 3-button pill group "All / Med+ / High" (min-score 0 / 50 / 80); the
  selected button gets `background: rgba(212,175,55,.14)`, `color: var(--gold-bright)`, `aria-pressed`.
- **Focus** — a text `<input>` (`width: clamp(150px,22vw,230px)`, `background: #0c0c0c`,
  `1px solid var(--line)`, radius 8, `12px`) backed by a `<datalist>` of known address ids;
  placeholder "Address · blank = overview"; commits on blur / Enter (local draft avoids refetch per keystroke).
- **Max nodes** — a `<select>` 10 / 25 / 50.
- **Pushed-right cluster** — Zoom out / Zoom in icon buttons (`height: 26`, `1px solid var(--line)`,
  radius 7) + **Fit** / **Reset** text buttons; all disabled until the canvas mounts.
- **Legend row** (full width): swatches high `--danger-2` / medium `--gold` / low `--ok`; if the
  result was capped → "Showing top {limit} — refine filters" in gold.

**Body** — `.graph-view__body` grid `1fr minmax(300px, 360px)` → single column `@900px`.

- **Stage** `.graph-view__stage` — `height: clamp(360px, 52vh, 560px)`, `1px solid var(--line)`,
  radius 14, `overflow: hidden`, dark radial-gradient bg.
  - **`GraphCanvas`** (Cytoscape, `next/dynamic ssr:false`; loading overlay "Loading graph
    engine…"). Layout `breadthfirst` (directed, `spacingFactor 1.2`, `padding 26`).
    `wheelSensitivity 0.2`, zoom `0.2–3`. `data-lenis-prevent`; a `ResizeObserver` re-fits.
    - **Nodes:** `background-color` by risk level (`--danger-2` / `--gold` / `--ok`),
      `size = 24 + round(score/6)`, mono `9px` label below, `text-outline` black 2px,
      `border 1px rgba(255,255,255,.22)`. Hover → `border 3px` white. Selected → white 3px
      border + a translucent colored `overlay` halo; its closed neighbourhood stays lit and
      **everything else dims to `opacity 0.22`** (edges `0.1`).
    - **Edges:** `width = 1.4 + min(4, txCount)`, color red if that flow's own risk is high else
      gold `rgba(212,175,55,.5)`, `curve-style: bezier`, small triangle target arrow, `opacity 0.75`.
  - **Overlays** `.graph-view__overlay` (centered, `background: rgba(8,8,10,.72)` + `blur(2px)`):
    `"Loading transaction graph…"` · empty `"No addresses match the current filters."` +
    `[Clear filters]` · error text + `[Retry]` (`role="alert"`).

- **Address drill-down** — `AddressDetails`, `<aside class="addr-details">` — `padding: 16`,
  `1px solid var(--line)`, radius 14, `background: var(--panel-soft)`,
  `max-height: clamp(360px,52vh,560px)`, `overflow-y: auto` (uncapped `@900px`). States:
  - **Placeholder:** `.eyebrow--gold` "Address Drill-down" + "Select an address node in the graph
    to inspect its flows, alerts and transaction history."
  - **Loading:** "Loading address…" + 3 shimmer skeleton bars (`addr-skeleton 1.3s`; off under reduced-motion).
  - **Error:** `.addr-details__error` (`--danger-2`) + `[Retry]` `.btn--gold` (`role="alert"`).
  - **Loaded:** head = eyebrow + mono address (`15px / 700`, `word-break: break-all`) + a "×"
    close. **Summary row:** risk `.pill` (level label) + "Score {n}" + category (capitalized, "—"
    if unknown). **Metrics grid** (4 → 2 `@480px`): Transactions / Incoming / Outgoing / Connected
    counts (`18px / 700`, tabular). Then blocks, each titled by an `.eyebrow`:
    - **Incoming / Outgoing flows** — rows of `[gold mono address button] · "{btc} · {n} tx" · [risk dot]`; empty → "No … flows in view."
    - **Connected addresses** — chips whose border tint follows risk level; click selects that address.
    - **Alerts** — `LEVEL · reason · "SCORE n"` per row (tone danger/warn/muted); empty → "No alerts for this address."
    - **Transaction history** — `time · "◂ in" / "out ▸" · counterparty · amount · status pill`;
      footer "{n} shown — full paginated history pending backend."
    - **Indicators** — a 2-col `<dl>` (Received / Sent in view, First / Last seen — *"pending
      backend"* in italic gold when null) + either a risk-factor bar list **or** the explicit
      note "Per-address risk-factor breakdown pending backend — `GET /api/addresses/{id}`".

### 5.13 SentriX AI assistant — `src/components/ai/*` (**lazy**, `next/dynamic ssr:false`)

A native forensic chatbot. Structure: `SentrixAIMount` (code-split boundary) → `SentrixAI`
(one `useSentrixAI` controller) → `SentrixAIButton` + `SentrixAIPanel` (→ `SentrixAIMessage`,
`SentrixAISuggestions`, `SentrixAITyping`, `SentrixAIInput`).

**Floating action button** — `.sai-fab`:
`position: fixed; right: max(20px, env(safe-area-inset-right)); bottom: max(20px, env(safe-area-inset-bottom)); z-index: 120`,
**56×56 circle**, `1px solid rgba(212,175,55,.55)`,
`background: radial-gradient(120% 120% at 30% 25%, #1a1a1a, #0b0b0b 60%, #050505)`,
`color: var(--gold-bright)`, `box-shadow: 0 8px 30px rgba(0,0,0,.55)`.
Glyph **`₿`** at 22px; when the panel is open it becomes **`✕`** at 16px in `--muted`.
A `.sai-fab__glow` layer (`inset: -6px`, radial gold) runs `sai-pulse 3.4s` (opacity 0.28↔0.55,
scale 1↔1.12) and hides while open. Hover → `translateY(-2px)` + gold glow `0 0 22px rgba(212,175,55,.28)`;
active → `scale(.97)`; `:focus-visible` → `0 0 0 3px rgba(245,215,110,.35)` ring.
It is a real `<button>` with `aria-label` ("Open/Close SentriX AI assistant"), `aria-expanded`,
`aria-haspopup="dialog"`.

**Panel** — `.sai-panel`, `role="dialog"`, `aria-label="SentriX AI assistant"`, `inert` +
`aria-hidden` when closed:
`position: fixed; right: max(20px, safe-area); bottom: calc(max(20px, safe-area) + 68px); z-index: 121`,
`width: min(410px, calc(100vw - 32px))`, `height: min(580px, calc(100vh - 140px))`,
`1px solid rgba(212,175,55,.22)`, `border-radius: 18px`, `background: rgba(10,10,10,.92)`,
`box-shadow: 0 24px 70px rgba(0,0,0,.62)`, `backdrop-filter: blur(16px)`, `transform-origin: bottom right`.
Closed = `opacity 0; transform: translateY(14px) scale(.96); visibility: hidden`. Open animates in
`opacity 160ms` + `transform 220ms cubic-bezier(0.22,1,0.36,1)`. **`@max-width: 560px`** → nearly
full width (`left: 10px; right: 10px; width: auto`), `height: min(72vh, 560px)`, bottom
`calc(max(12px, safe-area) + 66px)`. `Escape` closes; focus moves to the composer ~80ms after open.

- **Header** `.sai-panel__header` — `padding: 13px 14px`, bottom hairline,
  `background: linear-gradient(180deg, rgba(212,175,55,.05), transparent)`.
  **"SENTRIX AI"** (`12px / 700 / 0.18em`, `--gold-bright`) + **"● Online"** (`status-dot--ok` +
  text, `9px / 0.14em / uppercase`, `--ok`) on one row; **"Forensic Intelligence"** subtitle
  (`10px / 0.14em / uppercase`, `--muted-dim`) below. Right side: a **"Clear"** text button
  (only when there are messages) + a **"✕"** icon button. Tool buttons: `10px / 600 / 0.1em /
  uppercase`, `--muted` → `--fg` + hairline on hover.
- **Scroll body** `.sai-panel__body` — `flex: 1`, `overflow-y: auto`, `overscroll-behavior:
  contain`, `padding: 14`, `data-lenis-prevent`. Auto-sticks to the newest message / typing row.
- **Empty state** `.sai-empty` — `<h2>` **"Ask SentriX"** (`17px / 700`) · **"Your AI forensic
  assistant for Bitcoin investigations."** (`12.5px`, `--muted`) · **suggestion chips**
  `.sai-suggest__chip` (`padding: 6px 11px`, `border-radius: 999px`, `1px solid var(--line)`,
  `background: rgba(255,255,255,.02)`, `color: var(--gold-pale)`, `11.5px`; hover → gold border +
  `rgba(212,175,55,.08)` fill; disabled while a request is in flight). The 8 chips (each fires the
  **real** pipeline — no canned replies): *Explain this address · Show high-risk addresses · Why
  is this address risky? · Analyse recent alerts · Explain traffic anomalies · Help me navigate ·
  Summarise this dashboard · How does SentriX score risk?*
- **Messages** `.sai-msg-list` (gap 12, `max-width: 88%` per message):
  - **User** bubble → right-aligned, `background: rgba(212,175,55,.1)`, `border: 1px solid
    rgba(212,175,55,.35)`. **Assistant** bubble → left, `background: rgba(255,255,255,.025)`,
    `1px solid var(--line)`. **Error** bubble → red-tinted. All: `radius 13`, `12.5px /
    line-height 1.55`, `word-break: break-word`.
  - Rendering is deliberately minimal: inline **`**bold**`** → `--gold-bright` weight 700, blank
    lines split paragraphs, `\n` → `<br>`. **No HTML, no arbitrary markdown.**
  - A block that starts with the word **"Evidence"** renders as `.sai-msg__evidence` — a mono
    `11px` panel, `background: rgba(0,0,0,.35)`, `1px solid var(--line)`, radius 9,
    `white-space: pre-wrap` (used for the tool-derived score/level/count table).
  - **Source chips** `.sai-source-chip` — mono `10px`, `1px solid var(--line)`, `--muted` (the
    real tool + resource id behind the answer).
  - **Action buttons** `.sai-action-btn` — `1px solid rgba(212,175,55,.4)`, `--gold-bright`,
    `10.5px / 600`; hover → gold tint. Labels like "Go to graph view", "Open bc1q…x4f2",
    "Focus … in graph", "Filter graph: high risk". Executing one **only** scrolls to a known
    section id or dispatches a graph focus/filter/select command — never arbitrary JS/URLs.
  - **Timestamp** `.sai-msg__time` — `9px`, `--muted-dim`, localized `HH:MM`, real `<time datetime>`.
- **Typing indicator** `.sai-typing` — three 6px **gold dots** in a bordered pill,
  `sai-blink 1.3s` staggered `0 / 0.18 / 0.36s` (opacity 0.25↔1, `translateY 0↔-2px`).
  `role="status"`, "SentriX AI is thinking". *(Explicitly a SentriX-style `● ● ●`, not a spinner.)*
- **Error row** `.sai-error` — red-tinted strip, message + underlined gold **"Retry"** (`role="alert"`).
- **Composer** `.sai-input` — `align-items: flex-end`, `padding: 10px 12px calc(10px +
  env(safe-area-inset-bottom))`, top hairline, `background: rgba(0,0,0,.25)`. A `<textarea>`
  (`.sai-input__field`, `background: #0c0c0c`, `1px solid var(--line)`, radius 10, `12.5px`,
  `resize: none`) that auto-grows to **128px** then scrolls; placeholder "Ask SentriX AI…".
  **Enter submits, Shift+Enter = newline.** Send button `.sai-input__send` — 34×34, gold-tinted
  (`background: rgba(212,175,55,.12)`, `1px solid rgba(212,175,55,.5)`, `--gold-bright`), an
  up-arrow SVG; disabled when empty or a request is in flight.
- **Context awareness:** the panel sends a small structured snapshot with each message —
  `route`, `selected_address`, `selected_transaction`, `selected_node {id, risk_score, risk_level,
  entity_type}`, `graph_context {node_count, edge_count, focus_address}`. `GraphView` publishes
  this via a shared React context; the assistant can push a `GraphCommand` back to focus/filter/select.
- **Persistence:** `{conversationId, messages}` in **`sessionStorage`** only, capped at 40
  messages, **never a token**; a parse failure just starts fresh.
- **Reduced motion:** FAB pulse/glow, typing dots, and the panel open transition are disabled or shortened.

---

## 6. Motion & interaction system (cross-cutting)

- **Lenis smooth scroll** (`SmoothScroll.tsx`, in `layout.tsx`): `duration: 1.05`,
  `easing: t => 1 - (1 - t)^3`, `smoothWheel: true`, `touchMultiplier: 1.6`. The real scroll
  position still advances (sticky nav, IntersectionObserver, hash anchors all keep working).
  **Fully disabled under `prefers-reduced-motion`.** Any subtree with **`data-lenis-prevent`**
  keeps native wheel behaviour and gets `overscroll-behavior: contain` — applied to both graph
  canvases and the AI panel body.
- **`Reveal`** wrapper: the first time each section scrolls into view (IntersectionObserver,
  `rootMargin: 0px 0px -10% 0px`, `threshold: 0.05`) it eases from `opacity 0` /
  `translateY(22px)` to rest over `0.7s cubic-bezier(0.22,1,0.36,1)`. Accepts a `delay` (60/120ms
  staggers used) and an `id` (used as a scroll anchor). Under reduced-motion everything is shown immediately.
- **One-time entrances:** `.dashboard` runs `rise-in 0.9s` on load; the wordmark runs `wordmark-in 1.6s`.
- **AI navigation:** the assistant returns typed actions (`navigate`, `open_address`,
  `open_transaction`, `focus_graph_node`, `filter_risk`, `open_alert`). The frontend honours a
  fixed allow-list only — `navigate` resolves to one of six section ids
  (`overview`, `risk-overview`, `alerts`, `explainability`, `activity`, `graph-view`) and calls
  `scrollIntoView` (respecting reduced-motion); graph actions dispatch a `GraphCommand`.
  **No arbitrary JS, no URLs.**

---

## 7. Responsive behaviour (every breakpoint)

| Max-width | Change |
|---|---|
| 1000px | Top-nav primary links **hidden** (no replacement menu yet). |
| 900px | `--split` **and** `--pair` dashboard rows collapse to **one column**. Graph View body → one column; `AddressDetails` drops its `max-height`. |
| 820px | Stat grid 4 → **2 columns**. |
| 640px | Top-nav user chip **hidden**. |
| 560px | AI panel → **near-full-width** (`left/right: 10px`, `height: 72vh`). Explainability label column `178px → 118px`. |
| 480px | `AddressDetails` metrics 4 → 2; its `<dl>` 2 → 1 column. |
| 460px | Stat grid → **1 column**. |

`env(safe-area-inset-*)` is respected on the AI FAB, the AI panel, and the composer padding.
The dashboard column is always `min(1180px, 100% - 40px)` with clamped internal padding and margins.

---

## 8. Accessibility

- **Single route.** "Navigation" = smooth-scroll to section ids; never a router or `eval`.
- **AI FAB** = real `<button>` with `aria-label` / `aria-expanded` / `aria-haspopup="dialog"`.
  **AI panel** = `role="dialog"` + `aria-label`, `inert` + `aria-hidden` while closed, `Escape`
  closes, focus is moved into the composer on open.
- **Graphs:** SVG has `role="img"` + `aria-label`; SVG nodes are `role="button" tabIndex=0` with
  Enter/Space activation and descriptive `aria-label` ("{label}: {level} risk, score {n}, {in} in {out} out").
  Decorative canvases are `aria-hidden` + `pointer-events: none`.
- **Live regions:** `role="status"` (typing indicator, "Authenticating…"), `role="alert"`
  (every error / retry surface).
- **Forms:** `role="search"` on the header search; every input has an `aria-label` or bound
  `<label>`; nav is `aria-label="Primary"` with `aria-current`.
- **Focus:** gold `:focus-visible` rings on the FAB and inputs; buttons are all real `<button>`s.
- **Motion:** one global `@media (prefers-reduced-motion: reduce)` block neutralises every
  non-essential animation.

---

## 9. Data honesty / empty & error states

- Risk scores come from the backend as `0–1` and are **always** shown as `NN/100` + a LEVEL word.
- **Live** panels: Recent Risk Alerts, Graph View (dataset + drill-down), SentriX AI.
  **Fixture** panels (typed objects in `src/lib/dashboardData.ts`, swappable later): Stat Grid,
  Risk Overview, Bitcoin Transaction Graph (SVG), Explainability, Live Activity.
- Missing data is stated, never faked: `AddressDetails` shows *"pending backend"* for
  first/last-seen and the per-address factor breakdown; transaction history says "{n} shown —
  full paginated history pending backend".
- The AI assistant refuses to invent txids / addresses / scores / alerts / graph links /
  anomalies, separates "general knowledge" from live SentriX data, and says so when SentriX
  has nothing. Tool output is treated as untrusted data (prompt-injection fenced) and never
  leaks secrets or the system prompt.
- No stack traces are ever shown to the user.

---

## 10. File map (frontend)

```
src/app/
  layout.tsx          Inter font, <SmoothScroll/>, <AuthProvider>, globals.css
  page.tsx            → <AppShell/>
  globals.css         ~2480 lines: tokens + every component's CSS

src/components/
  AppShell.tsx                 shell composition + section ids + <SentrixAIMount/>
  SmoothScroll.tsx             Lenis
  BinaryField.tsx              0/1 canvas (ambient + intro variants)
  SiteIntro.tsx                boot gate state machine
  SentrixWordmark.tsx          "Sentrix" gradient wordmark
  BitcoinMedallion.tsx         gold ₿ disc (hero)
  Reveal.tsx                   on-scroll fade/rise wrapper
  TopNav.tsx                   sticky nav
  icons.tsx                    line icon set
  auth/AuthProvider.tsx        JWT session context (useAuth)
  auth/AuthGate.tsx            login gate
  auth/LoginScreen.tsx         sign-in card + demo chips
  dashboard/DashboardHeader.tsx StatGrid.tsx RiskOverview.tsx RiskGauge.tsx
  dashboard/TransactionGraph.tsx transactionGraphLayout.ts   (SVG graph + layered-DAG layout)
  dashboard/RiskAlerts.tsx     Explainability.tsx LiveActivityTable.tsx
  graph/GraphView.tsx          GraphControls.tsx GraphCanvas.tsx (Cytoscape) AddressDetails.tsx
  ai/SentrixAIMount.tsx SentrixAI.tsx useSentrixAI.ts
  ai/SentrixAIButton.tsx SentrixAIPanel.tsx SentrixAIMessage.tsx
  ai/SentrixAIInput.tsx SentrixAISuggestions.tsx SentrixAITyping.tsx

src/lib/
  dashboardData.ts    typed fixtures (nav, stats, gauge, SVG graph, alerts, explain, activity)
  graphTypes.ts        risk-level model + Graph View data contracts
  graphData.ts         offline graph fixture + KNOWN_ADDRESS_IDS
  api/*                apiFetch wrapper (/api proxy, bearer token), auth/alerts/graph clients
  ai/*                 types, client, shared context, reducer, action allow-list
```

---

## 11. Brief for a redesign (what to ask Manus / Bolt for)

**Keep (identity):**
1. Gold (`#d4af37` family) as the *only* accent on a near-black (`#050505`) ground; hairline
   `rgba(245,245,245,0.08)` borders; the tiny uppercase `0.16em` `.eyebrow` label idiom;
   tabular numerals; quiet, `prefers-reduced-motion`-safe motion.
2. Single-page structure: **boot gate → sticky nav → one scrolling dashboard**, plus the
   floating **₿ FAB → dark-glass AI console** bottom-right.
3. The data contracts and honesty rules in §1, §9 (scores as `NN/100` + LEVEL; no fabricated
   data; explicit "pending backend"; lazy-loaded graphs/AI).
4. Accessibility posture in §8 (dialog semantics, keyboard graph nodes, live regions, focus rings).

**Improve (open problems / low-confidence areas):**
- **Small-screen navigation** — primary nav simply disappears < 1000px with no menu. Design a
  real responsive nav (drawer / command-palette / condensed bar).
- **Visual hierarchy of the dashboard** — seven stacked cards of similar weight. Propose a
  stronger information hierarchy, grouping, and scan path; consider a denser "operations" layout.
- **The two transaction graphs** feel like different products (bespoke animated SVG vs. utilitarian
  Cytoscape). Unify their visual language, node/edge styling, legends, tooltips, and empty/loading treatment.
- **Risk Overview gauge** is a single static number with no history/trend/context. Rethink it
  (sparkline, factor mini-bars, time range, comparison to baseline).
- **Live Activity table** is plain. Improve density, sortability, inline risk visualization,
  row affordances, and how "suggested queries" connect to the AI assistant.
- **AI console** — refine message typography and the evidence/sources/actions treatment; design
  a stronger empty state, an in-panel "context pill" showing what the assistant can currently see,
  streaming output, and a better error/retry pattern. Panel is fixed 410×580 on desktop — explore
  a resizable / dockable / expand-to-rail mode.
- **Boot gate** — striking but adds latency to first real interaction and repeats every load.
  Propose a lighter-weight or sk-once version that keeps the brand moment.
- **Motion cohesion** — entrances use one easing; interactions are ad-hoc per component. Define a
  small, documented motion system (durations, easings, stagger rules) and apply it consistently.
- **Theming** — the app is dark-only. If a light / high-contrast mode is worthwhile for a
  forensic tool used in bright rooms, propose a token strategy for it.
- **Density & tablet** — the 900px→single-column jump is abrupt; design intermediate tablet layouts.

**Deliverable to ask for:** an updated design system (tokens + type scale + motion spec + component
inventory) and high-fidelity mockups of: the dashboard (desktop + tablet + mobile), the unified
transaction graph, the AI console (empty / mid-conversation / error), the login, and the responsive
navigation — all consistent with the retained identity above.
```
