/**
 * Synthetic blockchain-data fragments that fade in and out around the edges
 * (brief §6) — makes the environment feel like a live forensic system. All
 * values are obviously synthetic / truncated demo strings; nothing implies a
 * real wallet. CSS-animated, decorative, `aria-hidden`.
 */
const TRACES: ReadonlyArray<{ text: string; pos: string }> = [
  { text: "bc1q··7f2a", pos: "a" },
  { text: "0x83··91c4", pos: "b" },
  { text: "tx··a821", pos: "c" },
  { text: "BLOCK 912843", pos: "d" },
  { text: "TX INDEX 1842", pos: "e" },
  { text: "INPUT 04 · OUTPUT 02", pos: "f" },
  { text: "SIG VALID", pos: "g" },
  { text: "UTXO SET · 0x2", pos: "h" },
]

export function IntroDataTraces() {
  return (
    <div className="intro-traces" aria-hidden="true">
      {TRACES.map((t, i) => (
        <span
          key={t.pos}
          className={`intro-trace intro-trace--${t.pos}`}
          style={{ animationDelay: `${i * 1.7}s` }}
        >
          {t.text}
        </span>
      ))}
    </div>
  )
}
