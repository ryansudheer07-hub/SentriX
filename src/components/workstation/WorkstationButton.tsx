import type { ReactNode } from "react"

type WorkstationButtonProps = {
  children: ReactNode
  variant?: "primary" | "outline" | "ghost"
  icon?: ReactNode
  onClick?: () => void
}

/** Chunky mono-caps action button for `WorkstationHeader` rows. */
export function WorkstationButton({
  children,
  variant = "outline",
  icon,
  onClick,
}: WorkstationButtonProps) {
  return (
    <button
      type="button"
      className={`wk-btn wk-btn--${variant}`}
      onClick={onClick}
    >
      {icon && (
        <span className="wk-btn__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  )
}
