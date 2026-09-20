interface HorizonLogoProps {
  variant?: 'light' | 'dark'
  size?: string
  /** Render only the sun mark (square) — for collapsed rails and favicons-sized spots. */
  mark?: boolean
}

export default function HorizonLogo({ variant = 'light', size = '3rem', mark = false }: HorizonLogoProps) {
  const src = mark ? '/horizon-mark.png' : variant === 'dark' ? '/horizon-logo-dark.png' : '/horizon-logo.png'
  return (
    <img
      src={src}
      alt="Horizon"
      style={{ height: size, width: 'auto', display: 'inline-block', userSelect: 'none' }}
      draggable={false}
    />
  )
}
