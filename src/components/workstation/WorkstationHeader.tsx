import type { ElementType, ReactNode } from "react"

type WorkstationHeaderProps = {
  /** Show the top forensic status strip (SENTRIX // FORENSIC CORE · …). */
  hud?: boolean
  /** Right-hand HUD text. */
  hudRight?: string
  /** Small tracked eyebrow, e.g. "Investigator Workstation". */
  eyebrow: string
  /** Optional trailing eyebrow segment after a middot. */
  eyebrowTail?: string
  /** First title word(s), rendered in the primary text colour. */
  titleLead: string
  /** Trailing title word(s), rendered in gold. */
  titleAccent: string
  titleAs?: ElementType
  /** Mono meta line, e.g. "Case System 01 · tx…a821". */
  meta?: string
  description?: string
  /** A `<WorkstationButton>` row. */
  actions?: ReactNode
}

function ScanGlyph() {
  return (
    <svg
      className="wk-eyebrow__glyph"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 4V1h3M13 4V1h-3M1 10v3h3M13 10v3h-3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="7" cy="7" r="1.4" fill="currentColor" />
    </svg>
  )
}

/**
 * A forensic-workstation section header: an optional status strip, a tracked
 * mono eyebrow, a two-tone display title (lead in text colour, accent in gold),
 * a mono meta line, a mono description and an action row. Reused by the main
 * dashboard header and the Transaction Analysis surface.
 */
export function WorkstationHeader({
  hud = false,
  hudRight = "System Online · Live Case",
  eyebrow,
  eyebrowTail,
  titleLead,
  titleAccent,
  titleAs: Title = "h2",
  meta,
  description,
  actions,
}: WorkstationHeaderProps) {
  return (
    <header className="wk">
      {hud && (
        <div className="wk-hud" aria-hidden="true">
          <span className="wk-hud__side">
            <span className="wk-hud__badge">S</span>
            <span>
              SENTRIX{" "}
              <span className="wk-hud__dim">{"// FORENSIC CORE"}</span>
            </span>
          </span>
          <span className="wk-hud__side wk-hud__side--end">
            <span className="wk-hud__dot" />
            <span className="wk-hud__label">{hudRight.toUpperCase()}</span>
          </span>
        </div>
      )}

      <p className="wk-eyebrow">
        <ScanGlyph />
        <span>
          {eyebrow}
          {eyebrowTail ? (
            <>
              {" "}
              <span className="wk-eyebrow__sep">·</span> {eyebrowTail}
            </>
          ) : null}
        </span>
      </p>

      <Title className="wk-title">
        <span className="wk-title__lead">{titleLead}</span>{" "}
        <span className="wk-title__accent">{titleAccent}</span>
      </Title>

      {meta && <p className="wk-meta">{meta}</p>}
      {description && <p className="wk-desc">{description}</p>}
      {actions && <div className="wk-actions">{actions}</div>}
    </header>
  )
}
