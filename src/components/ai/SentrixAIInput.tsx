"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"

interface Props {
  disabled?: boolean
  onSend: (text: string) => void
}

const MAX_HEIGHT = 128

/**
 * Enter submits, Shift+Enter inserts a newline. The textarea auto-grows to a
 * capped height, then scrolls internally — it never pushes the panel around.
 */
export function SentrixAIInput({ disabled, onSend }: Props) {
  const [value, setValue] = useState("")
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue("")
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      className="sai-input"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <textarea
        ref={ref}
        className="sai-input__field"
        rows={1}
        placeholder="Ask SentriX AI…"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Message SentriX AI"
      />
      <button
        type="submit"
        className="sai-input__send"
        disabled={disabled || value.trim().length === 0}
        aria-label="Send message"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 13V3M8 3l-4 4M8 3l4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  )
}
