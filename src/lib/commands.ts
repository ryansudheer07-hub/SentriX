/**
 * Command-palette model (brief §26). Pure — the palette component supplies the
 * `run` closures and renders the results; matching/'paging' logic lives here so
 * it can be tested without a DOM.
 */
export interface Command {
  id: string
  label: string
  /** Short right-aligned context, e.g. a section number or "AI". */
  hint?: string
  run: () => void
}

/** Case-insensitive: every whitespace-separated term must appear in the label. */
export function matchCommand(label: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = label.toLowerCase()
  return q.split(/\s+/).every((term) => hay.includes(term))
}

export function filterCommands(commands: Command[], query: string): Command[] {
  return commands.filter((c) => matchCommand(c.label, query))
}

/** Wrap an index into `[0, len)`; returns 0 for an empty list. */
export function wrapIndex(index: number, len: number): number {
  if (len <= 0) return 0
  return ((index % len) + len) % len
}
