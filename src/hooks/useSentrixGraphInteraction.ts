"use client"

import {
  type CSSProperties,
  type MutableRefObject,
  type PointerEventHandler,
  type Ref,
  useCallback,
  useEffect,
  useRef,
} from "react"
import { useInView } from "framer-motion"

import { useIsHydrated } from "./useIsHydrated"
import {
  computeGraphInteraction,
  GRAPH_INTERACTION,
  REST_POINT,
  spotlightBackgroundImage,
} from "@/lib/graphInteraction"

interface LatestPoint {
  x: number
  y: number
  tx: number
  ty: number
  alpha: number
}

export interface UseSentrixGraphInteractionOptions {
  /**
   * The element's own `background-image`. The cursor spotlight is layered on
   * top of it and blended with `screen`, matching the Framer override.
   */
  baseBackgroundImage?: string
  /** Extra styles merged underneath the interaction styles. */
  style?: CSSProperties
  /** An optional forwarded ref that should also point at the host element. */
  ref?: Ref<HTMLElement | null>
  onPointerMove?: PointerEventHandler<HTMLElement>
  onPointerEnter?: PointerEventHandler<HTMLElement>
  onPointerLeave?: PointerEventHandler<HTMLElement>
}

export interface SentrixGraphInteractionProps {
  ref: (node: HTMLElement | null) => void
  style: CSSProperties
  onPointerMove: PointerEventHandler<HTMLElement>
  onPointerEnter: PointerEventHandler<HTMLElement>
  onPointerLeave: PointerEventHandler<HTMLElement>
}

/**
 * React port of the Framer `SentrixGraphInteraction` code override.
 *
 * Returns a bag of props to spread onto any element. While that element is in
 * view, pointer movement drives a soft white spotlight (a radial gradient
 * layered over the element's background) plus a few pixels of parallax
 * translate. All DOM writes are batched into a single `requestAnimationFrame`.
 *
 * Differences from the override, all behaviour-preserving:
 * - Framer's `useIsStaticRenderer()` is replaced by {@link useIsHydrated}; the
 *   handlers stay inert until the component has hydrated.
 * - The interaction styles are always emitted. The CSS custom properties
 *   default to their rest values (`--sentrix-a: 0`, `--sentrix-tx/ty: 0`), so
 *   the element looks untouched until the first pointer event -- this avoids a
 *   background-image swap on hydration.
 */
export function useSentrixGraphInteraction(
  options: UseSentrixGraphInteractionOptions = {}
): SentrixGraphInteractionProps {
  const hostRef = useRef<HTMLElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const latestPointRef = useRef<LatestPoint>({ ...REST_POINT, alpha: 0 })

  // Latest options, synced after commit so the stable callbacks below can read
  // current passthrough handlers / forwarded ref without re-subscribing.
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const isStatic = !useIsHydrated()
  const isInView = useInView(hostRef, { margin: "0px", amount: 0.1 })
  const active = !isStatic && isInView

  const setRef = useCallback((node: HTMLElement | null) => {
    hostRef.current = node

    const forwarded = optionsRef.current.ref
    if (typeof forwarded === "function") {
      forwarded(node)
    } else if (forwarded && "current" in forwarded) {
      ;(forwarded as MutableRefObject<HTMLElement | null>).current = node
    }
  }, [])

  const applyVisual = useCallback(() => {
    rafRef.current = null
    const node = hostRef.current
    if (!node) return

    const { x, y, tx, ty, alpha } = latestPointRef.current
    node.style.setProperty("--sentrix-x", `${x}%`)
    node.style.setProperty("--sentrix-y", `${y}%`)
    node.style.setProperty("--sentrix-tx", `${tx}px`)
    node.style.setProperty("--sentrix-ty", `${ty}px`)
    node.style.setProperty("--sentrix-a", `${alpha}`)
  }, [])

  const scheduleApply = useCallback(() => {
    if (typeof window === "undefined") return
    if (rafRef.current !== null) return
    rafRef.current = window.requestAnimationFrame(applyVisual)
  }, [applyVisual])

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  const handlePointerMove = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      optionsRef.current.onPointerMove?.(event)
      if (!active) return

      const rect = event.currentTarget.getBoundingClientRect()
      const point = computeGraphInteraction(event.clientX, event.clientY, rect)
      if (!point) return

      latestPointRef.current = { ...point, alpha: GRAPH_INTERACTION.moveAlpha }
      scheduleApply()
    },
    [active, scheduleApply]
  )

  const handlePointerEnter = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      optionsRef.current.onPointerEnter?.(event)
      if (!active) return

      latestPointRef.current = {
        ...latestPointRef.current,
        alpha: GRAPH_INTERACTION.enterAlpha,
      }
      scheduleApply()
    },
    [active, scheduleApply]
  )

  const handlePointerLeave = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      optionsRef.current.onPointerLeave?.(event)
      latestPointRef.current = { ...REST_POINT, alpha: GRAPH_INTERACTION.restAlpha }
      scheduleApply()
    },
    [scheduleApply]
  )

  const style: CSSProperties = {
    ...options.style,
    position: "relative",
    transform: "translate3d(var(--sentrix-tx, 0px), var(--sentrix-ty, 0px), 0)",
    transition: GRAPH_INTERACTION.transition,
    willChange: GRAPH_INTERACTION.willChange,
    backgroundImage: spotlightBackgroundImage(options.baseBackgroundImage),
    backgroundBlendMode: options.baseBackgroundImage ? "screen, normal" : undefined,
  }

  return {
    ref: setRef,
    style,
    onPointerMove: handlePointerMove,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
  }
}
