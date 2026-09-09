"use client"

import { useEffect, useRef } from "react"
import cytoscape from "cytoscape"

import { riskLevel, type GraphDataset } from "@/lib/graphTypes"

export interface GraphControlsApi {
  zoomIn: () => void
  zoomOut: () => void
  fit: () => void
  reset: () => void
}

type GraphCanvasProps = {
  dataset: GraphDataset
  selectedId: string | null
  onSelect: (id: string | null) => void
  onControls: (api: GraphControlsApi | null) => void
}

type Palette = {
  high: string
  medium: string
  low: string
  edge: string
  outline: string
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) =>
    css.getPropertyValue(name).trim() || fallback
  return {
    high: v("--danger-2", "#d94a4a"),
    medium: v("--gold", "#d4af37"),
    low: v("--ok", "#3fb950"),
    edge: "rgba(212, 175, 55, 0.5)",
    outline: v("--fg", "#f5f5f5"),
  }
}

function toElements(
  dataset: GraphDataset,
  palette: Palette
): cytoscape.ElementDefinition[] {
  const nodes = dataset.nodes.map((n) => {
    const level = riskLevel(n.riskScore)
    const size = 24 + Math.round(n.riskScore / 6)
    return {
      data: {
        id: n.id,
        label: n.label,
        level,
        score: n.riskScore,
        color: palette[level],
        size,
        hoverSize: size + 6,
      },
    }
  })
  const edges = dataset.edges.map((e) => {
    const hot = riskLevel(e.riskScore) === "high"
    return {
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        width: 1.4 + Math.min(4, e.txCount),
        color: hot ? palette.high : palette.edge,
      },
    }
  })
  return [...nodes, ...edges]
}

function buildStyle(palette: Palette): cytoscape.StylesheetJson {
  return [
    {
      selector: "node",
      style: {
        "background-color": "data(color)",
        width: "data(size)",
        height: "data(size)",
        label: "data(label)",
        color: palette.outline,
        "font-size": 9,
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "text-valign": "bottom",
        "text-halign": "center",
        "text-margin-y": 4,
        "text-outline-color": "#000000",
        "text-outline-width": 2,
        "border-width": 1,
        "border-color": "rgba(255, 255, 255, 0.22)",
        "transition-property":
          "width, height, border-width, border-color, opacity",
        "transition-duration": 130,
      },
    },
    {
      selector: "node.hover",
      style: {
        "border-width": 3,
        "border-color": palette.outline,
        width: "data(hoverSize)",
        height: "data(hoverSize)",
      },
    },
    {
      selector: "node.selected",
      style: {
        "border-width": 3,
        "border-color": palette.outline,
        "overlay-color": "data(color)",
        "overlay-opacity": 0.18,
        "overlay-padding": 6,
      },
    },
    { selector: "node.dim", style: { opacity: 0.22 } },
    {
      selector: "edge",
      style: {
        width: "data(width)",
        "line-color": "data(color)",
        "target-arrow-color": "data(color)",
        "target-arrow-shape": "triangle",
        "arrow-scale": 0.9,
        "curve-style": "bezier",
        opacity: 0.75,
        "transition-property": "opacity",
        "transition-duration": 120,
      },
    },
    { selector: "edge.dim", style: { opacity: 0.1 } },
  ]
}

/**
 * Interactive transaction graph (Cytoscape.js). Address nodes coloured by the
 * shared risk model, directional transaction edges, hover + selection, zoom /
 * pan / fit / reset via the exposed controls API. Client-only; mounted through
 * `next/dynamic({ ssr: false })` so Cytoscape stays out of the server bundle.
 */
export function GraphCanvas({
  dataset,
  selectedId,
  onSelect,
  onControls,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)
  const handlers = useRef({ onSelect, onControls })

  useEffect(() => {
    handlers.current = { onSelect, onControls }
  })

  // Create the instance once.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const palette = readPalette()
    const cy = cytoscape({
      container,
      elements: toElements(dataset, palette),
      style: buildStyle(palette),
      layout: { name: "breadthfirst", directed: true, spacingFactor: 1.2, padding: 26 },
      wheelSensitivity: 0.2,
      minZoom: 0.2,
      maxZoom: 3,
    })
    cyRef.current = cy

    cy.on("mouseover", "node", (e) => {
      e.target.addClass("hover")
      container.style.cursor = "pointer"
    })
    cy.on("mouseout", "node", (e) => {
      e.target.removeClass("hover")
      container.style.cursor = "default"
    })
    cy.on("tap", "node", (e) => handlers.current.onSelect(e.target.id()))
    cy.on("tap", (e) => {
      if (e.target === e.cy) handlers.current.onSelect(null)
    })

    const centered = () => ({
      x: cy.width() / 2,
      y: cy.height() / 2,
    })
    handlers.current.onControls({
      zoomIn: () =>
        cy.zoom({ level: cy.zoom() * 1.25, renderedPosition: centered() }),
      zoomOut: () =>
        cy.zoom({ level: cy.zoom() / 1.25, renderedPosition: centered() }),
      fit: () => cy.animate({ fit: { eles: cy.elements(), padding: 28 } }, { duration: 160 }),
      reset: () => {
        cy.elements().removeClass("selected dim")
        cy.fit(undefined, 28)
      },
    })

    const ro = new ResizeObserver(() => {
      cy.resize()
      cy.fit(undefined, 28)
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      handlers.current.onControls(null)
      cy.destroy()
      cyRef.current = null
    }
    // Instance is created once; dataset/selection handled in the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap elements when the dataset changes.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    const palette = readPalette()
    cy.batch(() => {
      cy.elements().remove()
      cy.add(toElements(dataset, palette))
    })
    cy.layout({
      name: "breadthfirst",
      directed: true,
      spacingFactor: 1.2,
      padding: 26,
    }).run()
    cy.fit(undefined, 28)
  }, [dataset])

  // Reflect the selected address: highlight it + its neighbourhood, dim the rest.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.batch(() => {
      cy.elements().removeClass("selected dim")
      if (!selectedId) return
      const node = cy.$id(selectedId)
      if (node.empty()) return
      node.addClass("selected")
      const keep = node.closedNeighborhood()
      cy.elements().difference(keep).addClass("dim")
    })
  }, [selectedId])

  return <div ref={containerRef} className="graph-canvas" data-lenis-prevent />
}
