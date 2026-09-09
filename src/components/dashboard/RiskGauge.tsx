type RiskGaugeProps = {
  /** 0-100. */
  value: number
  size?: number
}

const R = 52
const CIRC = 2 * Math.PI * R

/** Circular gold gauge ring. Center content is overlaid by the caller. */
export function RiskGauge({ value, size = 168 }: RiskGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const progress = (clamped / 100) * CIRC

  return (
    <svg
      className="risk-gauge"
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Risk score ${clamped} of 100`}
    >
      <defs>
        <filter id="riskGaugeGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4.2" />
        </filter>
      </defs>
      <circle
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke="rgba(245, 215, 110, 0.16)"
        strokeWidth="4"
      />
      <circle
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke="#f5d76e"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${progress} ${CIRC - progress}`}
        transform="rotate(-90 60 60)"
        filter="url(#riskGaugeGlow)"
      />
      <circle
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke="#f5d76e"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={`${progress} ${CIRC - progress}`}
        transform="rotate(-90 60 60)"
      />
    </svg>
  )
}
