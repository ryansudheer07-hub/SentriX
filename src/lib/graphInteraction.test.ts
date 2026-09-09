import { describe, expect, it } from "vitest"

import {
  computeGraphInteraction,
  GRAPH_INTERACTION,
  spotlightBackgroundImage,
  type RectLike,
} from "./graphInteraction"

const rect: RectLike = { left: 100, top: 200, width: 400, height: 200 }

describe("computeGraphInteraction", () => {
  it("returns null when the rect has no area", () => {
    expect(computeGraphInteraction(0, 0, { ...rect, width: 0 })).toBeNull()
    expect(computeGraphInteraction(0, 0, { ...rect, height: 0 })).toBeNull()
  })

  it("maps the centre of the element to 50% / no parallax", () => {
    const point = computeGraphInteraction(300, 300, rect)
    expect(point).toEqual({ x: 50, y: 50, tx: 0, ty: 0 })
  })

  it("maps the top-left corner to 0% and the minimum translate", () => {
    const point = computeGraphInteraction(rect.left, rect.top, rect)
    expect(point).toEqual({
      x: 0,
      y: 0,
      tx: -GRAPH_INTERACTION.translateScale / 2,
      ty: -GRAPH_INTERACTION.translateScale / 2,
    })
  })

  it("maps the bottom-right corner to 100% and the maximum translate", () => {
    const point = computeGraphInteraction(
      rect.left + rect.width,
      rect.top + rect.height,
      rect
    )
    expect(point).toEqual({
      x: 100,
      y: 100,
      tx: GRAPH_INTERACTION.translateScale / 2,
      ty: GRAPH_INTERACTION.translateScale / 2,
    })
  })

  it("clamps pointer positions outside the element to the 0-100 range", () => {
    const farAway = computeGraphInteraction(-1000, 100000, rect)
    expect(farAway).toEqual({
      x: 0,
      y: 100,
      tx: -GRAPH_INTERACTION.translateScale / 2,
      ty: GRAPH_INTERACTION.translateScale / 2,
    })
  })
})

describe("spotlightBackgroundImage", () => {
  it("layers the spotlight over an existing background image", () => {
    const value = spotlightBackgroundImage("linear-gradient(#000, #111)")
    expect(value).toContain(
      `radial-gradient(${GRAPH_INTERACTION.spotlightRadius}px circle at`
    )
    expect(value).toContain("var(--sentrix-x, 50%) var(--sentrix-y, 50%)")
    expect(value).toContain("rgba(255, 255, 255, var(--sentrix-a, 0))")
    expect(value.endsWith("linear-gradient(#000, #111)")).toBe(true)
  })

  it("falls back to `none` when there is no base background", () => {
    expect(spotlightBackgroundImage().endsWith(", none")).toBe(true)
    expect(spotlightBackgroundImage("none").endsWith(", none")).toBe(true)
  })
})
