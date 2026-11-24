import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
)
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)
export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Icon>
)
export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
)
export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </Icon>
)
export const PauseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 5v14M16 5v14" strokeWidth={3} />
  </Icon>
)
export const StepIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 5v14l9-7z" fill="currentColor" />
    <path d="M18 5v14" strokeWidth={2.5} />
  </Icon>
)
export const ResetIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Icon>
)
export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Icon>
)
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Icon>
)
export const CrossIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 7l10 10M17 7L7 17" />
  </Icon>
)
export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)
export const LogoIcon = (p: IconProps) => (
  <svg viewBox="0 0 32 32" width="1em" height="1em" aria-hidden="true" {...p}>
    <rect x="1" y="1" width="30" height="30" rx="7" fill="#fdf3dc" stroke="#2b1d16" strokeWidth="2" />
    <rect x="7" y="7" width="9" height="9" rx="2" fill="#f2bf45" stroke="#2b1d16" strokeWidth="1.5" />
    <circle cx="20.5" cy="20.5" r="5" fill="#e0393e" stroke="#2b1d16" strokeWidth="1.5" />
    <path d="M16 11.5h4.5V15.5" stroke="#0b6b4f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </svg>
)
