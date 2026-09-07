"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

import { graphEdges, graphLegend, graphNodes } from "@/lib/dashboardData"
import { GraphInteraction } from "../GraphInteraction"
import { MinusIcon, PlusIcon } from "../icons"
import { layoutLayeredDag } from "./transactionGraphLayout"

const VB_W = 1000
const VB_H = 470
const AREA = { x0: 96, x1: 904, y0: 122, y1: 348 }
const MIN_SCALE = 0.6
const MAX_SCALE = 2.6

const CANVAS_BACKGROUND =
  "radial-gradient(120% 120% at 50% 0%, #12100a 0%, #0b0b0b 55%, #080808 100%)"

type RiskLevel = "high" | "medium" | "low"
type EntityKind = "source" | "intermediary" | "mixer" | "exchange" | "high-risk"
type EdgeTone = "gold" | "danger" | "faint"

const ENTITY: Record<string, EntityKind> = {
  source: "source",
  intermediate: "intermediary",
  mixer: "mixer",
  exchange: "exchange",
  highrisk: "high-risk",
}

const RISK: Record<string, { level: RiskLevel; score: number }> = {
  source: { level: "medium", score: 51 },
  intermediate: { level: "low", score: 28 },
  mixer: { level: "medium", score: 74 },
  exchange: { level: "low", score: 17 },
  highrisk: { level: "high", score: 95 },
}

const EDGE_FLOW: Record<string, number> = {
  "source->intermediate": 2.6,
  "source->mixer": 12.4,
  "mixer->exchange": 3.9,
  "mixer->highrisk": 8.3,
}

const RISK_KEY: { level: RiskLevel; label: string }[] = [
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
]

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

interface GNode {
  id: string
  label: string
  entity: EntityKind
  level: RiskLevel
  score: number
  inDeg: number
  outDeg: number
  cx: number
  cy: number
  r: number
}

interface GEdge {
  id: string
  from: string
  to: string
  tone: EdgeTone
  flow: number
  d: string
  width: number
}

function edgePath(a: GNode, b: GNode): string {
  const dx = b.cx - a.cx
  const dy = b.cy - a.cy
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const sx = a.cx + ux * (a.r + 3)
  const sy = a.cy + uy * (a.r + 3)
  const ex = b.cx - ux * (b.r + 12)
  const ey = b.cy - uy * (b.r + 12)
  const mx = (sx + ex) / 2
  return (
    `M ${sx.toFixed(1)} ${sy.toFixed(1)} ` +
    `C ${mx.toFixed(1)} ${sy.toFixed(1)}, ${mx.toFixed(1)} ${ey.toFixed(1)}, ` +
    `${ex.toFixed(1)} ${ey.toFixed(1)}`
  )
}

function EntityGlyph({ kind }: { kind: EntityKind }) {
  switch (kind) {
    case "source":
      return <path d="M7 1 V12 M3 8 L7 12.5 L11 8" />
    case "mixer":
      return <path d="M1.5 5 Q7 1 12.5 5 M1.5 9 Q7 13 12.5 9" />
    case "exchange":
      return <path d="M2 4.5 H11 L8 1.5 M12 9.5 H3 L6 12.5" />
    case "high-risk":
      return (
        <>
          <path d="M7 1 L13 12.5 H1 Z" />
          <path d="M7 5.5 V8.5 M7 10.6 h0.01" />
        </>
      )
    default:
      return <circle cx="7" cy="7" r="3.4" />
  }
}

export function TransactionGraph() {
  const model = useMemo(() => {
    const pos = layoutLayeredDag({ nodes: graphNodes, edges: graphEdges })
    const inDeg = new Map<string, number>()
    const outDeg = new Map<string, number>()
    for (const n of graphNodes) {
      inDeg.set(n.id, 0)
      outDeg.set(n.id, 0)
    }
    for (const e of graphEdges) {
      outDeg.set(e.from, (outDeg.get(e.from) ?? 0) + 1)
      inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1)
    }

    const nodes: GNode[] = graphNodes.map((n) => {
      const p = pos.get(n.id) ?? { x: 0.5, y: 0.5, layer: 0 }
      const risk = RISK[n.id] ?? { level: "low" as RiskLevel, score: 0 }
      return {
        id: n.id,
        label: n.label,
        entity: ENTITY[n.id] ?? "intermediary",
        level: risk.level,
        score: risk.score,
        inDeg: inDeg.get(n.id) ?? 0,
        outDeg: outDeg.get(n.id) ?? 0,
        cx: AREA.x0 + p.x * (AREA.x1 - AREA.x0),
        cy: AREA.y0 + p.y * (AREA.y1 - AREA.y0),
        r: risk.level === "high" ? 32 : 27,
      }
    })

    const byId = new Map(nodes.map((n) => [n.id, n]))
    const edges: GEdge[] = graphEdges.flatMap((e) => {
      const a = byId.get(e.from)
      const b = byId.get(e.to)
      if (!a || !b) return []
      const tone = e.tone as EdgeTone
      const flow =
        EDGE_FLOW[`${e.from}->${e.to}`] ??
        (tone === "danger" ? 8 : tone === "gold" ? 10 : 1.6)
      return [
        {
          id: `${e.from}->${e.to}`,
          from: e.from,
          to: e.to,
          tone,
          flow,
          d: edgePath(a, b),
          width: 2 + clamp(Math.sqrt(flow) * 1.05, 0, 6),
        },
      ]
    })

    const neighbours = new Map<string, Set<string>>()
    for (const n of nodes) neighbours.set(n.id, new Set([n.id]))
    for (const e of edges) {
      neighbours.get(e.from)?.add(e.to)
      neighbours.get(e.to)?.add(e.from)
    }

    return { nodes, edges, neighbours }
  }, [])

  const [hoverId, setHoverId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const [flowOn, setFlowOn] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{
    id: number
    x: number
    y: number
    moved: boolean
    onNode: boolean
  } | null>(null)

  // Enable animated flow after mount, unless the visitor prefers reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const raf = requestAnimationFrame(() => setFlowOn(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Non-passive wheel zoom, anchored on the cursor.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (evt: WheelEvent) => {
      if (Math.abs(evt.deltaY) < Math.abs(evt.deltaX)) return
      evt.preventDefault()
      const rect = svg.getBoundingClientRect()
      const px = ((evt.clientX - rect.left) / rect.width) * VB_W
      const py = ((evt.clientY - rect.top) / rect.height) * VB_H
      setView((v) => {
        const s2 = clamp(v.scale * (evt.deltaY < 0 ? 1.12 : 1 / 1.12), MIN_SCALE, MAX_SCALE)
        const wx = (px - v.tx) / v.scale
        const wy = (py - v.ty) / v.scale
        return { scale: s2, tx: px - wx * s2, ty: py - wy * s2 }
      })
    }
    svg.addEventListener("wheel", onWheel, { passive: false })
    return () => svg.removeEventListener("wheel", onWheel)
  }, [])

  const zoomAbout = useCallback(
    (factor: number, px = VB_W / 2, py = VB_H / 2) => {
      setView((v) => {
        const s2 = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE)
        const wx = (px - v.tx) / v.scale
        const wy = (py - v.ty) / v.scale
        return { scale: s2, tx: px - wx * s2, ty: py - wy * s2 }
      })
    },
    []
  )

  const resetView = useCallback(() => setView({ scale: 1, tx: 0, ty: 0 }), [])

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const onNode = !!(e.target as Element).closest?.(".tx-node")
    dragRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      onNode,
    }
    if (!onNode) e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d || d.id !== e.pointerId || d.onNode) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = ((e.clientX - d.x) * VB_W) / rect.width
    const dy = ((e.clientY - d.y) * VB_H) / rect.height
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 3) d.moved = true
    d.x = e.clientX
    d.y = e.clientY
    setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }))
  }

  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d || d.id !== e.pointerId) return
    if (!d.onNode && !d.moved) setSelectedId(null)
    dragRef.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  const toggleNode = (id: string) =>
    setSelectedId((s) => (s === id ? null : id))

  const active = selectedId ?? hoverId
  const activeSet = active ? model.neighbours.get(active) ?? null : null

  const nodeClass = (n: GNode) => {
    const parts = ["tx-node", `tx-node--${n.level}`]
    if (n.id === selectedId) parts.push("tx-node--selected")
    if (activeSet) parts.push(activeSet.has(n.id) ? "is-hot" : "is-dim")
    return parts.join(" ")
  }

  const edgeClass = (e: GEdge) => {
    const parts = ["tx-graph__edge", `tx-graph__edge--${e.tone}`]
    if (active) {
      parts.push(e.from === active || e.to === active ? "is-hot" : "is-dim")
    }
    return parts.join(" ")
  }

  const arrow = (tone: EdgeTone) => `url(#tx-arrow-${tone})`

  return (
    <section className="panel tx-graph">
      <div className="tx-graph__head">
        <p className="eyebrow eyebrow--gold">Bitcoin Transaction Graph</p>
        <p className="eyebrow tx-graph__meta">Entity Paths · Last 24h</p>
      </div>

      <div className="tx-graph__legend" aria-hidden="true">
        {graphLegend.map((label, i) => (
          <span key={label} className="tx-graph__legend-item">
            {label}
            {i < graphLegend.length - 1 && (
              <span className="tx-graph__legend-dash" />
            )}
          </span>
        ))}
      </div>

      <GraphInteraction
        className="tx-graph__canvas"
        baseBackgroundImage={CANVAS_BACKGROUND}
      >
        <div className="tx-graph__toolbar">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoomAbout(1.2)}
            disabled={view.scale >= MAX_SCALE}
          >
            <PlusIcon size={13} />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoomAbout(1 / 1.2)}
            disabled={view.scale <= MIN_SCALE}
          >
            <MinusIcon size={13} />
          </button>
          <button type="button" onClick={resetView}>
            Fit
          </button>
          <button
            type="button"
            onClick={() => {
              resetView()
              setSelectedId(null)
              setHoverId(null)
            }}
          >
            Reset
          </button>
        </div>

        <div className="tx-graph__key" aria-hidden="true">
          {RISK_KEY.map((k) => (
            <span
              key={k.level}
              className={`tx-graph__key-item tx-graph__key-item--${k.level}`}
            >
              <span className="tx-graph__key-dot" />
              {k.label}
            </span>
          ))}
        </div>

        <svg
          ref={svgRef}
          className="tx-graph__svg"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Bitcoin transaction flow graph"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            {(["gold", "danger", "faint"] as EdgeTone[]).map((tone) => (
              <marker
                key={tone}
                id={`tx-arrow-${tone}`}
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 z" className={`tx-arrow tx-arrow--${tone}`} />
              </marker>
            ))}
            <radialGradient id="tx-disc-high" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ff9a9a" />
              <stop offset="55%" stopColor="#e5484d" />
              <stop offset="100%" stopColor="#7c1f22" />
            </radialGradient>
            <radialGradient id="tx-disc-medium" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#fff0c4" />
              <stop offset="55%" stopColor="#e6b93f" />
              <stop offset="100%" stopColor="#8a6414" />
            </radialGradient>
            <radialGradient id="tx-disc-low" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#9be8ab" />
              <stop offset="55%" stopColor="#3fb950" />
              <stop offset="100%" stopColor="#1a5c28" />
            </radialGradient>
            <pattern
              id="tx-grid"
              width="42"
              height="42"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M42 0 H0 V42"
                fill="none"
                stroke="rgba(255,255,255,0.035)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect
            className="tx-graph__bg"
            x="0"
            y="0"
            width={VB_W}
            height={VB_H}
            fill="url(#tx-grid)"
          />

          <g
            transform={`translate(${view.tx.toFixed(2)} ${view.ty.toFixed(2)}) scale(${view.scale.toFixed(3)})`}
          >
            <g className="tx-graph__edges">
              {model.edges.map((e) => (
                <g key={e.id} className={edgeClass(e)}>
                  <path
                    className="tx-graph__edge-line"
                    d={e.d}
                    strokeWidth={e.width}
                    markerEnd={arrow(e.tone)}
                  />
                  {flowOn && (
                    <>
                      <path
                        className="tx-graph__edge-flow"
                        d={e.d}
                        strokeWidth={Math.max(1.4, e.width - 1)}
                      />
                      <circle
                        className="tx-graph__particle"
                        r={Math.max(2, e.width * 0.62)}
                      >
                        <animateMotion
                          dur={`${clamp(6 - e.flow * 0.22, 2.6, 5).toFixed(1)}s`}
                          repeatCount="indefinite"
                          path={e.d}
                          rotate="auto"
                        />
                      </circle>
                    </>
                  )}
                </g>
              ))}
            </g>

            <g className="tx-graph__nodes">
              {model.nodes.map((n) => {
                const track = 2 * Math.PI * (n.r + 6)
                return (
                  <g
                    key={n.id}
                    className={nodeClass(n)}
                    transform={`translate(${n.cx.toFixed(1)} ${n.cy.toFixed(1)})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${n.label}: ${n.level} risk, score ${n.score}, ${n.inDeg} in ${n.outDeg} out`}
                    onPointerEnter={() => setHoverId(n.id)}
                    onPointerLeave={() =>
                      setHoverId((h) => (h === n.id ? null : h))
                    }
                    onClick={() => toggleNode(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggleNode(n.id)
                      }
                    }}
                  >
                    <circle className="tx-node__halo" r={n.r + 13} />
                    <circle className="tx-node__arc-track" r={n.r + 6} />
                    <circle
                      className="tx-node__arc"
                      r={n.r + 6}
                      strokeDasharray={`${((n.score / 100) * track).toFixed(1)} ${track.toFixed(1)}`}
                      transform="rotate(-90)"
                    />
                    <circle
                      className="tx-node__disc"
                      r={n.r}
                      fill={`url(#tx-disc-${n.level})`}
                    />
                    <g className="tx-node__glyph" transform="translate(-7 -7)">
                      <EntityGlyph kind={n.entity} />
                    </g>
                    <text
                      className="tx-node__label"
                      y={n.r + 23}
                      textAnchor="middle"
                    >
                      {n.label}
                    </text>
                    <text
                      className="tx-node__type"
                      y={n.r + 36}
                      textAnchor="middle"
                    >
                      {n.entity}
                    </text>

                    {active === n.id && (
                      <g
                        className="tx-node__tip"
                        transform={`translate(0 ${-(n.r + 16)})`}
                      >
                        <rect x="-66" y="-48" width="132" height="44" rx="6" />
                        <text
                          className="tx-node__tip-title"
                          x="0"
                          y="-32"
                          textAnchor="middle"
                        >
                          {n.entity}
                        </text>
                        <text
                          className="tx-node__tip-meta"
                          x="0"
                          y="-19"
                          textAnchor="middle"
                        >
                          Risk {n.score} · {n.level}
                        </text>
                        <text
                          className="tx-node__tip-meta"
                          x="0"
                          y="-8"
                          textAnchor="middle"
                        >
                          {n.inDeg} in · {n.outDeg} out
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </g>
          </g>
        </svg>
      </GraphInteraction>
    </section>
  )
}
