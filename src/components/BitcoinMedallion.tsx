import type { SVGProps } from "react"

type BitcoinMedallionProps = Omit<SVGProps<SVGSVGElement>, "viewBox"> & {
  /** Rendered width/height in px. */
  size?: number
  title?: string
}

/**
 * Gold Bitcoin medallion for the hero -- the "proper" mark that replaces the
 * dark, hard-to-read coin in the reference. Polished gold disc, dark B glyph,
 * soft outer glow. The B path is the community `cryptocurrency-icons` glyph.
 */
export function BitcoinMedallion({
  size = 92,
  title = "Bitcoin",
  ...props
}: BitcoinMedallionProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>{title}</title>
      <defs>
        <radialGradient id="medallionFace" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#fff4d0" />
          <stop offset="34%" stopColor="#f5d76e" />
          <stop offset="68%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8f6b1c" />
        </radialGradient>
        <linearGradient id="medallionRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbe9a8" />
          <stop offset="100%" stopColor="#6f5214" />
        </linearGradient>
        <filter id="medallionGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <circle
        cx="60"
        cy="62"
        r="47"
        fill="#d4af37"
        opacity="0.35"
        filter="url(#medallionGlow)"
      />
      <circle cx="60" cy="60" r="47" fill="url(#medallionRim)" />
      <circle cx="60" cy="60" r="42" fill="url(#medallionFace)" />
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke="#fff4d0"
        strokeOpacity="0.55"
        strokeWidth="1.4"
      />
      <path
        d="M42 30a44 44 0 0 1 36 4"
        fill="none"
        stroke="#fffdf5"
        strokeOpacity="0.5"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <g transform="translate(60 60) scale(2.05) translate(-16 -16)" fill="#1c1503">
        <path
          fillRule="nonzero"
          d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.216-1.385-.317l.695-2.784L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.302.531-.79.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.147.986-5.32.695l.947-3.805c1.174.294 4.933.874 4.373 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
        />
      </g>
    </svg>
  )
}
