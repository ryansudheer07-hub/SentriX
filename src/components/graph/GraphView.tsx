"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useState } from "react"

import { useSentrixContext } from "@/lib/ai/context"
import { IntelligenceDrawer } from "@/components/glass/IntelligenceDrawer"
import { getAddressDetail, getGraphDataset } from "@/lib/api/graph"
import { riskLevel, type AddressDetail, type GraphDataset } from "@/lib/graphTypes"
import { AddressDetails, type AddressDetailsStatus } from "./AddressDetails"
import type { GraphControlsApi } from "./GraphCanvas"
import { GraphControls } from "./GraphControls"

const GraphCanvas = dynamic(
  () => import("./GraphCanvas").then((m) => m.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="graph-view__overlay">Loading graph engine…</div>
    ),
  }
)

type DatasetStatus = "loading" | "ready" | "empty" | "error"

const DEFAULT_LIMIT = 25

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback

/**
 * Additive dashboard section: an interactive transaction graph plus a per-
 * address drill-down, backed by the SentriX API (`@/lib/api/graph` ->
 * `/graph/{id}`, `/address/{id}/risk`). Reuses the shared risk model
 * (`riskLevel`); `@/lib/graphData` remains as the offline fixture.
 */
export function GraphView() {
  const [minRisk, setMinRisk] = useState(0)
  const [focus, setFocus] = useState("")
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [dsRetry, setDsRetry] = useState(0)

  const [dataset, setDataset] = useState<GraphDataset | null>(null)
  const [dsStatus, setDsStatus] = useState<DatasetStatus>("loading")
  const [dsError, setDsError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailRetry, setDetailRetry] = useState(0)
  const [detail, setDetail] = useState<AddressDetail | null>(null)
  const [detailStatus, setDetailStatus] = useState<AddressDetailsStatus>("idle")
  const [detailError, setDetailError] = useState<string | null>(null)

  const [controls, setControls] = useState<GraphControlsApi | null>(null)

  const { setContext, command } = useSentrixContext()

  // ---- publish "what the user is looking at" to the SentriX AI context ----
  useEffect(() => {
    const node = dataset?.nodes.find((n) => n.id === selectedId)
    setContext({
      selectedAddress: selectedId ?? undefined,
      selectedNode: selectedId
        ? {
            id: selectedId,
            riskScore: node?.riskScore,
            riskLevel: node ? riskLevel(node.riskScore) : undefined,
            entityType: node?.category,
          }
        : undefined,
      graphContext: {
        nodeCount: dataset?.nodes.length,
        edgeCount: dataset?.edges.length,
        focusAddress: focus || undefined,
      },
    })
  }, [setContext, selectedId, dataset, focus])

  // ---- apply a command from the assistant (focus / filter / select) ----
  // Adjust local state during render when a new command arrives -- the
  // previous-value pattern the graph controls already use, not an effect.
  const [appliedCommand, setAppliedCommand] = useState(0)
  if (command && command.nonce !== appliedCommand) {
    setAppliedCommand(command.nonce)
    if (command.focusAddress !== undefined) setFocus(command.focusAddress)
    if (command.selectId !== undefined) setSelectedId(command.selectId || null)
    if (command.riskFilter !== undefined) {
      setMinRisk(
        command.riskFilter === "high"
          ? 80
          : command.riskFilter === "medium"
            ? 50
            : 0
      )
    }
  }

  // ---- dataset ----
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await Promise.resolve() // don't flip state synchronously inside the effect
      if (cancelled) return
      setDsStatus("loading")
      setDsError(null)
      try {
        const ds = await getGraphDataset({
          minRisk: minRisk || undefined,
          focus: focus || undefined,
          limit,
        })
        if (cancelled) return
        setDataset(ds)
        setDsStatus(ds.nodes.length === 0 ? "empty" : "ready")
      } catch (err) {
        if (cancelled) return
        setDsStatus("error")
        setDsError(message(err, "Failed to load graph."))
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [minRisk, focus, limit, dsRetry])

  // ---- per-address drill-down ----
  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    const run = async () => {
      await Promise.resolve()
      if (cancelled) return
      setDetailStatus("loading")
      setDetailError(null)
      try {
        const d = await getAddressDetail(selectedId)
        if (cancelled) return
        setDetail(d)
        setDetailStatus("loaded")
      } catch (err) {
        if (cancelled) return
        setDetailStatus("error")
        setDetailError(message(err, "Failed to load address."))
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [selectedId, detailRetry])

  const handleSelectAddress = useCallback((id: string) => setSelectedId(id), [])
  const clearFilters = useCallback(() => {
    setFocus("")
    setMinRisk(0)
  }, [])

  const hasGraph = !!dataset && dataset.nodes.length > 0

  return (
    <section id="graph-view" className="panel panel--primary graph-view">
      <div className="graph-view__head">
        <p className="eyebrow eyebrow--gold">Transaction Graph</p>
        <p className="eyebrow graph-view__meta">Address flow · risk-weighted</p>
      </div>

      <GraphControls
        minRisk={minRisk}
        onMinRiskChange={setMinRisk}
        focus={focus}
        onFocusChange={setFocus}
        limit={limit}
        onLimitChange={setLimit}
        controls={controls}
        truncated={dataset?.truncated ?? false}
      />

      <div className="graph-view__body">
        <div className="graph-view__stage">
          {hasGraph && (
            <GraphCanvas
              dataset={dataset}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onControls={setControls}
            />
          )}

          {dsStatus === "loading" && (
            <div className="graph-view__overlay">Loading transaction graph…</div>
          )}
          {dsStatus === "empty" && (
            <div className="graph-view__overlay">
              <span>No addresses match the current filters.</span>
              <button type="button" className="btn btn--gold" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
          {dsStatus === "error" && (
            <div className="graph-view__overlay" role="alert">
              <span>{dsError}</span>
              <button
                type="button"
                className="btn btn--gold"
                onClick={() => setDsRetry((n) => n + 1)}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      <IntelligenceDrawer
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Address"
        className="intel-drawer--graph"
      >
        <AddressDetails
          status={selectedId ? detailStatus : "idle"}
          detail={selectedId ? detail : null}
          error={detailError}
          onRetry={() => setDetailRetry((n) => n + 1)}
          onSelectAddress={handleSelectAddress}
          onClose={() => setSelectedId(null)}
        />
      </IntelligenceDrawer>
    </section>
  )
}
