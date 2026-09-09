/**
 * Forensic-system metadata around the edges of the intro (brief §7). Tiny,
 * monospace, low opacity — reads as system telemetry, not dashboard widgets.
 * Decorative and non-interactive.
 */
export function IntroHud() {
  return (
    <div className="intro-hud" aria-hidden="true">
      <div className="intro-hud__cell intro-hud__cell--tl">
        <span>
          SENTRIX <span className="intro-hud__dim">{"// FORENSIC CORE"}</span>
        </span>
        <span className="intro-hud__dim">CASE SYSTEM 01</span>
      </div>

      <div className="intro-hud__cell intro-hud__cell--tr">
        <span>
          <span className="intro-hud__dot" /> SYSTEM ONLINE
        </span>
        <span className="intro-hud__dim">NETWORK: BITCOIN</span>
      </div>

      <div className="intro-hud__cell intro-hud__cell--bl">
        <span className="intro-hud__dim">CHAIN TIP SYNCED</span>
        <span className="intro-hud__dim">LATENCY 3 MS</span>
      </div>

      <div className="intro-hud__cell intro-hud__cell--br">
        <span>ENGINE: READY</span>
        <span className="intro-hud__dim">BUILD 2.4.1</span>
      </div>
    </div>
  )
}
