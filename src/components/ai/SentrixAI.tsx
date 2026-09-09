"use client"

import { SentrixAIButton } from "./SentrixAIButton"
import { SentrixAIPanel } from "./SentrixAIPanel"
import { useSentrixAI } from "./useSentrixAI"

/**
 * Native SentriX AI surface: the floating coin plus the console it opens. One
 * controller feeds both so state stays in a single place. Lazy-loaded via
 * `SentrixAIMount` so it stays out of the initial dashboard bundle.
 */
export function SentrixAI() {
  const ai = useSentrixAI()

  return (
    <>
      <SentrixAIButton isOpen={ai.isOpen} onToggle={ai.toggle} />
      <SentrixAIPanel
        open={ai.isOpen}
        onClose={ai.close}
        mode={ai.mode}
        onCycleMode={ai.cycleMode}
        state={ai.state}
        canSend={ai.canSend}
        onSend={ai.send}
        onRetry={ai.retry}
        onClear={ai.clear}
        onAction={ai.runAction}
      />
    </>
  )
}
