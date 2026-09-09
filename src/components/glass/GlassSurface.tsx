import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react"

/**
 * The forensic glass system (brief §3). Four levels of depth, applied as
 * classes (styles live in `globals.css`):
 *
 *   0  base        — barely-there lift, **no blur** (use behind dense tables/lists)
 *   1  interactive — the default panel surface
 *   2  floating    — raised controls / cards, gold-tinted edge + shadow
 *   3  overlay     — intelligence surfaces (AI console, popups, command palette)
 *
 * `reactive` opts the surface into the pointer spotlight (see `PointerField`).
 * No client JS — it is just a classed element.
 */
type GlassLevel = 0 | 1 | 2 | 3

type GlassSurfaceProps = {
  /** Element/component to render. Defaults to `div`. */
  as?: ElementType
  level?: GlassLevel
  reactive?: boolean
  className?: string
  children?: ReactNode
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">

export function GlassSurface({
  as: Tag = "div",
  level = 1,
  reactive = false,
  className,
  children,
  ...rest
}: GlassSurfaceProps) {
  const cls = [
    "glass",
    `glass--${level}`,
    reactive ? "glass-reactive" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  )
}
