/**
 * Topology-driven layout for the dashboard transaction graph.
 *
 * Layers a directed acyclic flow graph by longest path from a source, then
 * spreads the nodes of each layer vertically. Positions are normalised (0..1)
 * so the component can map them onto any viewBox. No hardcoded coordinates.
 */

export interface LayoutInput {
  nodes: { id: string }[]
  edges: { from: string; to: string }[]
}

export interface LayoutNode {
  id: string
  /** Longest-path layer index (0 = a source with no inbound edges). */
  layer: number
  /** 0..1, left -> right by layer. */
  x: number
  /** 0..1, top -> bottom by slot within the layer. */
  y: number
}

export function layoutLayeredDag(
  input: LayoutInput
): Map<string, LayoutNode> {
  const ids = input.nodes.map((n) => n.id)
  const successors = new Map<string, string[]>()
  const indegree = new Map<string, number>()
  for (const id of ids) {
    successors.set(id, [])
    indegree.set(id, 0)
  }
  for (const e of input.edges) {
    if (!successors.has(e.from) || !indegree.has(e.to)) continue
    successors.get(e.from)!.push(e.to)
    indegree.set(e.to, indegree.get(e.to)! + 1)
  }

  // Kahn's algorithm: layer(n) = max(layer(pred)) + 1
  const layer = new Map<string, number>(ids.map((id) => [id, 0]))
  const remaining = new Map(indegree)
  const queue = ids.filter((id) => remaining.get(id) === 0)
  while (queue.length) {
    const id = queue.shift()!
    for (const next of successors.get(id) ?? []) {
      layer.set(next, Math.max(layer.get(next)!, layer.get(id)! + 1))
      remaining.set(next, remaining.get(next)! - 1)
      if (remaining.get(next) === 0) queue.push(next)
    }
  }

  const maxLayer = Math.max(0, ...layer.values())

  // Group by layer, preserving input order for a stable vertical arrangement.
  const buckets = new Map<number, string[]>()
  for (const id of ids) {
    const L = layer.get(id)!
    if (!buckets.has(L)) buckets.set(L, [])
    buckets.get(L)!.push(id)
  }

  const out = new Map<string, LayoutNode>()
  for (const [L, group] of buckets) {
    const x = maxLayer === 0 ? 0.5 : L / maxLayer
    group.forEach((id, i) => {
      const y = group.length === 1 ? 0.5 : (i + 0.5) / group.length
      out.set(id, { id, layer: L, x, y })
    })
  }
  return out
}
