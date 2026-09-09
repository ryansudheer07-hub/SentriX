import type { ElementType, ReactNode } from "react"

type SentrixWordmarkProps = {
  /** Heading level / element to render. Defaults to `h1`. */
  as?: ElementType
  className?: string
  /** Disable the entrance animation (it also respects prefers-reduced-motion). */
  animate?: boolean
  /** Override the visible glyphs (e.g. the intro's system-init resolve). */
  children?: ReactNode
  /** Keep the accessible name stable while `children` is a transient scramble. */
  "aria-label"?: string
}

/**
 * The "Sentrix" wordmark. On mount it eases in slowly and smoothly -- a gentle
 * rise + de-blur + tracking settle over ~1.6s (see `.sentrix-wordmark` in
 * globals.css). Honors `prefers-reduced-motion`.
 */
export function SentrixWordmark({
  as: Tag = "h1",
  className,
  animate = true,
  children,
  "aria-label": ariaLabel,
}: SentrixWordmarkProps) {
  return (
    <Tag
      aria-label={ariaLabel}
      className={[
        "sentrix-wordmark",
        animate ? "sentrix-wordmark--animate" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children ?? "Sentrix"}
    </Tag>
  )
}
