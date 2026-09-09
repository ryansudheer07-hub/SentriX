/**
 * Single implementation of "glide the dashboard to a section anchor". Used by
 * the section rail, the mobile nav, the command palette and the AI navigation
 * allow-list, so they all behave identically and all respect reduced motion.
 */
export function scrollToSection(id: string): boolean {
  if (typeof document === "undefined") return false
  const el = document.getElementById(id)
  if (!el) return false
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  return true
}
