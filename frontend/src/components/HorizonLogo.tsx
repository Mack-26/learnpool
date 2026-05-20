export default function HorizonLogo({ variant = 'light', size = '3rem' }: { variant?: 'light' | 'dark'; size?: string }) {
  return (
    <img
      src={variant === 'dark' ? '/horizon-logo-dark.png' : '/horizon-logo.png'}
      alt="Horizon"
      style={{ height: size, width: 'auto', display: 'inline-block', userSelect: 'none' }}
      draggable={false}
    />
  )
}
