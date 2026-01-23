type LogoIconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface LogoIconProps {
  /** Size variant */
  size?: LogoIconSize;
  /** Additional classes */
  className?: string;
}

const sizeConfig: Record<LogoIconSize, number> = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

/**
 * Icon-only version of the logo (document with header)
 * Use for favicons, small spaces, or alongside text
 */
export function LogoIcon({ size = "md", className = "" }: LogoIconProps) {
  const dimension = sizeConfig[size];

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 64 72"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="webresume.now icon"
      role="img"
    >
      {/* Document shadow */}
      <rect x="8" y="8" width="48" height="56" rx="4" fill="#0D0D0D" />

      {/* Document body */}
      <rect
        x="4"
        y="4"
        width="48"
        height="56"
        rx="4"
        fill="#FDF8F3"
        stroke="#0D0D0D"
        strokeWidth="3"
      />

      {/* Red header bar */}
      <path
        d="M 4 8 C 4 6 6 4 8 4 L 48 4 C 50 4 52 6 52 8 L 52 18 L 4 18 Z"
        fill="#FF6B6B"
        stroke="#0D0D0D"
        strokeWidth="3"
      />

      {/* Window dots */}
      <circle cx="14" cy="11" r="2.5" fill="#0D0D0D" />
      <circle cx="22" cy="11" r="2.5" fill="#0D0D0D" />

      {/* Text lines */}
      <rect x="12" y="28" width="32" height="4" rx="1" fill="#0D0D0D" />
      <rect x="12" y="38" width="24" height="4" rx="1" fill="#0D0D0D" />
      <rect x="12" y="48" width="28" height="4" rx="1" fill="#0D0D0D" />
    </svg>
  );
}
