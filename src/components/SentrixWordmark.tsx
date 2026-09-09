import type { ElementType } from "react"

type SentrixWordmarkProps = {
  /** Heading level / element to render. Defaults to `h1`. */
  as?: ElementType
  className?: string
  /** Disable the entrance animation (it also respects prefers-reduced-motion). */
  animate?: boolean
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
}: SentrixWordmarkProps) {
  return (
    <Tag
      className={[
        "sentrix-wordmark",
        animate ? "sentrix-wordmark--animate" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      Sentrix
    </Tag>
  )
}
