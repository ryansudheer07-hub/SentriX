"use client"

import { useEffect, useRef, useState } from "react"

import { WorkstationButton } from "@/components/workstation/WorkstationButton"
import { WorkstationHeader } from "@/components/workstation/WorkstationHeader"
import { requestOpenSentrixAI } from "@/lib/ai/events"
import { riskOverview, txAnalysisSeries } from "@/lib/dashboardData"
import { scrollToSection } from "@/lib/scroll"
import { hashString, seedSeries } from "@/lib/seed"
import { TX_ANALYZE_EVENT, type TxAnalyzeDetail } from "@/lib/txAnalysis"
import { ArrowUpRight } from "../icons"
import { TxChartCard } from "./TxChartCard"

const short = (s: string) =>
  s.length > 26 ? `${s.slice(0, 12)}…${s.slice(-10)}` : s

const sum = (a: number[]) => Math.round(a.reduce((x, y) => x + y, 0))

function PulseGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M1 7h2.2l1.6-4 2.4 8 1.6-4H12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Bottom-of-dashboard analysis surface. Dormant until a query is submitted in
 * the hero search; then it seeds three fixture series from a hash of the query,
 * renders them as a 3D fan of glass charts (centre flat, sides angled toward
 * the viewer) and scrolls itself to the very bottom of the viewport. The series
 * are illustrative — not chain data — and labelled as such.
 */
export function TransactionAnalysis() {
  const [query, setQuery] = useState<string | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const onAnalyze = (e: Event) => {
      const detail = (e as CustomEvent<TxAnalyzeDetail>).detail
      if (!detail?.query) return
      setQuery(detail.query)
      requestAnimationFrame(() => {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
        ref.current?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "end",
        })
      })
    }
    window.addEventListener(TX_ANALYZE_EVENT, onAnalyze)
    return () => window.removeEventListener(TX_ANALYZE_EVENT, onAnalyze)
  }, [])

  const seed = query ? hashString(query) : 0
  const risk = seedSeries(riskOverview.trend, seed)
  const value = seedSeries(txAnalysisSeries.value, seed)
  const fanout = seedSeries(txAnalysisSeries.fanout, seed)

  return (
    <section
      ref={ref}
      id="transaction-analysis"
      className="panel panel--primary tx-analysis"
      aria-label="Transaction analysis"
    >
      <WorkstationHeader
        eyebrow="Investigator Workstation"
        eyebrowTail="Case View"
        titleLead="Transaction"
        titleAccent="analysis"
        meta={
          query
            ? `Case System 01 · ${short(query)}`
            : "Case System 01 · Awaiting query"
        }
        description="Trace asset movement, assess exposure, and identify relationship density across the active transaction cluster."
        actions={
          <>
            <WorkstationButton
              variant="primary"
              icon={<PulseGlyph />}
              onClick={() => scrollToSection("activity")}
            >
              Live stream
            </WorkstationButton>
            <WorkstationButton
              variant="outline"
              onClick={() => scrollToSection("graph-view")}
            >
              Network graph
            </WorkstationButton>
            <WorkstationButton
              variant="ghost"
              icon={<ArrowUpRight size={12} />}
              onClick={() => requestOpenSentrixAI()}
            >
              Ask Sentrix
            </WorkstationButton>
          </>
        }
      />

      {query ? (
        <>
          <div className="tx-analysis__stage">
            <TxChartCard
              pos="left"
              label="Value flow"
              unit="btc"
              stat={sum(value)}
              values={value}
            />
            <TxChartCard
              pos="center"
              label="Risk trajectory"
              unit="/ 100"
              stat={risk[risk.length - 1] ?? 0}
              values={risk}
            />
            <TxChartCard
              pos="right"
              label="Peer fan-out"
              unit="peers"
              stat={sum(fanout)}
              values={fanout}
            />
          </div>
          <p className="tx-analysis__note">
            Illustrative intelligence surfaces, seeded by the query — hover a
            chart to inspect points.
          </p>
        </>
      ) : (
        <div className="tx-analysis__dormant">
          <span className="tx-analysis__dormant-mark" aria-hidden="true">
            ₿
          </span>
          <p>Submit a transaction to open its analysis surfaces.</p>
        </div>
      )}
    </section>
  )
}
