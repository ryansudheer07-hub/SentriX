# SentriX Immersive Redesign — Phase 1: Foundation

**Date:** 2026-09-09
**Status:** approved, implementing
**Part of:** the 8-phase "immersive forensic command center" redesign (see the 43-section brief).
Later phases: 2 Navigation · 3 Spatial dashboard + Risk Core · 4 Chart system · 5 Unified graph ·
6 Live stream + Alerts · 7 AI console · 8 Boot.

## Goal

Introduce the **substrate** every later phase builds on — a glass/depth token system, reusable
glass + motion primitives, a pointer-reactive ambient environment — and apply a **visible
shell reskin** (nav, dashboard container, panels, AI panel) with **no change to layout, data
flow, auth, graph logic, or any component's behavior**.

## Non-negotiables carried from the brief

- Gold-on-near-black identity; no new palette (§33 lists the exact values already in `:root`).
- Data honesty (§36) and risk scale `NN/100` + LEVEL (§37) — untouched.
- §40 "do not break": JWT auth, `/api` proxy, AI safety boundaries + allow-lists, data
  contracts, sessionStorage persistence, lazy loading, Lenis, `prefers-reduced-motion`,
  keyboard graph interaction, alert retry, backend-pending states.
- §35: no new heavy deps; effects must not block first paint; rAF / IO / RO / passive
  listeners / compositor-friendly transform+opacity only.

## Approach

**Token-swap in place.** Keep every class name and DOM node. Redefine shared surface rules in
`globals.css` to consume `--glass-*` tokens + depth treatment. Add primitives for new code and
later phases. Motion is **hand-rolled rAF** (matching `BinaryField` / `Reveal` /
`TransactionGraph`); `framer-motion` stays unused.

## Deliverables

### Token layer — `src/app/globals.css` `:root` (additive only)

- Glass: `--glass-0-bg` `rgba(255,255,255,.015)`, `--glass-1-bg` `rgba(15,15,15,.68)`,
  `--glass-2-bg` `rgba(10,10,10,.78)`, `--glass-3-bg` `rgba(8,8,8,.86)`;
  `--glass-border` `rgba(255,255,255,.09)`, `--glass-border-soft` `rgba(255,255,255,.07)`,
  `--glass-border-gold` `rgba(212,175,55,.16)`, `--glass-border-gold-strong` `rgba(212,175,55,.22)`;
  `--glass-blur-1..3` (`blur(14|22|28px) saturate(110|115|125%)`),
  `--glass-shadow-2` `0 24px 80px rgba(0,0,0,.45)`, `--glass-inset` `inset 0 1px 0 rgba(255,255,255,.025)`.
- Motion: `--ease-fluid` `cubic-bezier(.22,1,.36,1)` (aliases the de-facto easing),
  `--ease-soft` `cubic-bezier(.16,1,.3,1)`, `--ease-snap` `cubic-bezier(.2,.8,.2,1)`;
  `--dur-micro 160ms`, `--dur-interaction 280ms`, `--dur-panel 520ms`, `--dur-section 850ms`,
  `--dur-cinematic 1200ms`.
- Pointer/env: `--ptr-x`, `--ptr-y`, `--ptr-active` (0), `--field-density` (1).
- Type-scale tokens deferred to Phase 3 (no consumers yet).

### `src/components/glass/GlassSurface.tsx` (server component)

`<GlassSurface level={0|1|2|3} reactive as="div" className>` → `class="glass glass--{level}
[glass-reactive] {className}"`. `level={0}` emits **no `backdrop-filter`** — the "never blur
behind dense tables" rule (§3) baked into the API. Polymorphic `as` via `ElementType`.

### `src/components/glass/FloatingPanel.tsx` (`"use client"`)

`<FloatingPanel open level={2|3} onClose labelledBy className>` — `GlassSurface` + fixed/enter
-exit transition (`translateY(10px) scale(.97) → 0`, `--ease-fluid` / `--dur-panel`), `inert` +
`aria-hidden` when closed, `Escape` → `onClose`. First real consumers in Phases 5–7; built here
as the shared shell.

### `src/components/motion/MotionNumber.tsx` (`"use client"`) + `src/lib/motion/tween.ts`

`<MotionNumber value format={n=>String(Math.round(n))} animateOnMount className />` → `<span>` with
`tabular-nums`. On `value` change: rAF tween prev→next, `easeSoft`, duration from
`tweenDuration(delta)`. **SSR-safe** (`useState(value)` → server and first client render match).
`animateOnMount` → tween `0 → value` once. Reduced motion → snap.
`tween.ts` (pure, tested): `easeSoft`, `cubicBezier(x1,y1,x2,y2)` (Newton-Raphson solver),
`interpolate(from,to,t)`, `tweenDuration(delta, base=280, max=520)`.

### `src/components/motion/PointerField.tsx` (`"use client"`) + `src/lib/motion/pointer.ts`

Mounts once in `layout.tsx` beside `<SmoothScroll/>`, renders `null`. `pointermove` (passive) +
rAF writes `--ptr-x`/`--ptr-y` (px) and `--ptr-active` (1, decays via `decay()` half-life ~180ms
to 0 ~1s after last move) onto `<html>`. rAF stops when idle, restarts on move. Gated on
`matchMedia('(pointer:fine)')`; disabled under `prefers-reduced-motion` (change listener kept).
`pointer.ts` (pure, tested): `decay(active, dt, halfLife)`, `shouldIdle(active)`, `clamp`.

**Reactive glass (CSS):** `.glass-reactive { position:relative; overflow:hidden; contain:paint }`
+ `.glass-reactive::before` = `position:fixed`, `60vmax` circle, radial gold gradient,
`transform: translate3d(var(--ptr-x),var(--ptr-y),0)` (compositor-only),
`opacity: calc(var(--ptr-active)*.5)`, `z-index:-1` (behind content, over the surface tint).
Applied via selector list to `.dashboard`, `.topnav`, `.panel`, `.sai-panel` (not graph stages —
§29). `.topnav`/`.sai-panel` keep their existing positioning; only `overflow`/`contain` added.

### `src/components/motion/Reveal.tsx` (upgraded) + `src/components/Reveal.tsx` (re-export shim) + `src/lib/motion/scrollProgress.ts`

Backward-compatible: no new props ⇒ identical one-shot IO behavior. New opt-in props:
`from` (`"up"|"down"|"none"`), `distance` (default 22 — preserves current transform),
`scaleFrom`, `track` (while intersecting, rAF sets `--reveal-p` 0→1 for later-phase parallax).
`.reveal` CSS transform becomes `translateY(var(--reveal-dist,22px)) scale(var(--reveal-scale,1))`.
`scrollProgress.ts` (pure, tested): `viewportProgress(top, height, vh)` →
`clamp((vh - top) / (vh + height), 0, 1)`.

### `src/components/BinaryField.tsx` — ambient variant upgrade

Enable the existing heat/trail machinery for the `ambient` variant with gentler per-variant
constants (`hlRadius 120`, `hlBoost .5`, `heatDecay .9`) so cells near the cursor softly
brighten. Add ≤3 concurrent horizontal "data traces" (short gold segments sweeping a row,
fading). Read `--field-density` on mount + on a `sentrix:field-density` window event (Phase 3
sets it). Opacity stays 0.05–0.16. Reduced motion: unchanged (static, no pointer, no traces).

### Shell reskin — `globals.css` rule changes only

`.dashboard` → glass-0 base + inset highlight + faint atmospheric radial · `.panel` → glass-1
recipe, **except `.activity` → glass-0** (dense table) · `.topnav` → glass system + `[data-scrolled]`
gold hairline · `.sai-panel` → glass-3 · `.login__card` / `.addr-details` / `.graph-view__overlay`
/ `.tx-graph__toolbar` / `.tx-graph__key` → glass-1/2 tokens · `prefers-reduced-motion` block
extended (spotlight, orbit ring, traces). Layout/spacing/DOM unchanged.

### Small component touches

- `src/components/dashboard/RiskOverview.tsx` — score wrapped in `<MotionNumber animateOnMount>`.
- `src/components/ai/SentrixAIButton.tsx` — add `<span className="sai-fab__ring" aria-hidden>`; CSS slow orbit, reduced-motion static.
- `src/components/TopNav.tsx` — passive `scroll` listener toggles `data-scrolled` (`scrollY > 8`).
- `src/app/layout.tsx` — mount `<PointerField/>`.

## Testing

- New pure unit tests (vitest node env): `tween.test.ts`, `pointer.test.ts`, `scrollProgress.test.ts`.
- Gate: existing **43 frontend + 96 backend** tests stay green; `tsc --noEmit`, `eslint`,
  `next build` clean.
- Manual: glass depth on nav/dashboard/panels; pointer spotlight glides, absent under reduced
  motion; risk score animates once, no layout shift; Lenis + graph wheel/zoom + AI panel open unaffected.

## File map

```
src/lib/motion/           tween.ts pointer.ts scrollProgress.ts (+ .test.ts each)
src/components/glass/      GlassSurface.tsx FloatingPanel.tsx
src/components/motion/     PointerField.tsx MotionNumber.tsx Reveal.tsx
src/components/Reveal.tsx  → re-export shim
modified: app/globals.css, app/layout.tsx, components/BinaryField.tsx,
          components/TopNav.tsx, components/dashboard/RiskOverview.tsx,
          components/ai/SentrixAIButton.tsx
```
