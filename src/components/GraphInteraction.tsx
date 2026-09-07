"use client"

import {
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  forwardRef,
} from "react"

import {
  useSentrixGraphInteraction,
  type UseSentrixGraphInteractionOptions,
} from "@/hooks/useSentrixGraphInteraction"

type GraphInteractionProps = HTMLAttributes<HTMLElement> & {
  /** Element to render. Defaults to `div`. */
  as?: ElementType
  /**
   * The element's own `background-image`. The cursor spotlight is layered over
   * it (blended with `screen`), so pass the gradient/image you want lit up.
   */
  baseBackgroundImage?: string
  style?: CSSProperties
}

/**
 * Drop-in wrapper around {@link useSentrixGraphInteraction} for the common case:
 * a single element that should get the SentriX graph spotlight + parallax.
 *
 *   <GraphInteraction baseBackgroundImage="linear-gradient(...)">
 *     <Chart />
 *   </GraphInteraction>
 */
export const GraphInteraction = forwardRef<HTMLElement, GraphInteractionProps>(
  function GraphInteraction(
    {
      as: Tag = "div",
      baseBackgroundImage,
      style,
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      children,
      ...rest
    },
    ref
  ) {
    const interactionOptions: UseSentrixGraphInteractionOptions = {
      baseBackgroundImage,
      style,
      ref,
      onPointerMove: onPointerMove ?? undefined,
      onPointerEnter: onPointerEnter ?? undefined,
      onPointerLeave: onPointerLeave ?? undefined,
    }

    const interaction = useSentrixGraphInteraction(interactionOptions)

    return (
      <Tag {...rest} {...interaction}>
        {children}
      </Tag>
    )
  }
)
