/**
 * A faint blockchain transaction graph behind the wordmark (brief §2). Static
 * SVG geometry, CSS-animated pulse — no rAF. Purely decorative (`aria-hidden`),
 * opacity ~0.05–0.16 via CSS. Nodes read as addresses, lines as relationships.
 */
const NODES: ReadonlyArray<readonly [number, number]> = [
  [140, 96],
  [300, 58],
  [452, 118],
  [72, 232],
  [244, 196],
  [408, 262],
  [168, 356],
  [332, 344],
  [488, 322],
]

const EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 4],
  [2, 5],
  [3, 4],
  [4, 5],
  [4, 6],
  [5, 8],
  [6, 7],
  [7, 8],
  [3, 6],
]

export function IntroNetwork() {
  return (
    <svg
      className="intro-net"
      viewBox="0 0 560 420"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g className="intro-net__edges">
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a][0]}
            y1={NODES[a][1]}
            x2={NODES[b][0]}
            y2={NODES[b][1]}
            className="intro-net__edge"
            style={{ animationDelay: `${(i % 6) * 0.9}s` }}
          />
        ))}
      </g>
      <g className="intro-net__nodes">
        {NODES.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 4 : 2.6}
            className="intro-net__node"
            style={{ animationDelay: `${(i % 5) * 1.1}s` }}
          />
        ))}
      </g>

      {/* value moving through the graph — native SMIL, no rAF */}
      <g className="intro-net__flow">
        <circle r="3.2">
          <animateMotion
            dur="7.6s"
            begin="0.4s"
            repeatCount="indefinite"
            path="M72,232 L244,196 L300,58 L452,118 L408,262 L488,322"
          />
        </circle>
        <circle r="2.4">
          <animateMotion
            dur="9.2s"
            begin="2.4s"
            repeatCount="indefinite"
            path="M168,356 L244,196 L140,96 L300,58 L408,262 L332,344"
          />
        </circle>
        <circle r="2">
          <animateMotion
            dur="6.8s"
            begin="4s"
            repeatCount="indefinite"
            path="M488,322 L408,262 L244,196 L72,232 L168,356"
          />
        </circle>
      </g>
    </svg>
  )
}
