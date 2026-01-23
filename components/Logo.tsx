type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface LogoProps {
  /** Size variant */
  size?: LogoSize;
  /** Additional classes */
  className?: string;
}

const sizeConfig: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 90, height: 20 },
  sm: { width: 135, height: 30 },
  md: { width: 180, height: 40 },
  lg: { width: 270, height: 60 },
  xl: { width: 360, height: 80 },
};

/**
 * SVG Logo component with neubrutalist styling
 * Renders the full brand logo with icon and text
 */
export function Logo({ size = "md", className = "" }: LogoProps) {
  const { width, height } = sizeConfig[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 360 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="webresume.now logo"
      role="img"
    >
      <defs>
        <style>
          {`.logo-text-main { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 36px; fill: #0D0D0D; }
          .logo-text-tld { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 24px; fill: #FFFFFF; }`}
        </style>
      </defs>

      {/* Document icon shadow */}
      <rect x="14" y="14" width="44" height="52" rx="4" fill="#0D0D0D" />

      {/* Document body */}
      <rect
        x="10"
        y="10"
        width="44"
        height="52"
        rx="4"
        fill="#FDF8F3"
        stroke="#0D0D0D"
        strokeWidth="3"
      />

      {/* Red header bar */}
      <path
        d="M 10 14 C 10 12 12 10 14 10 L 50 10 C 52 10 54 12 54 14 L 54 22 L 10 22 Z"
        fill="#FF6B6B"
        stroke="#0D0D0D"
        strokeWidth="3"
      />

      {/* Window dots */}
      <circle cx="18" cy="16" r="2" fill="#0D0D0D" />
      <circle cx="24" cy="16" r="2" fill="#0D0D0D" />

      {/* Text lines */}
      <rect x="18" y="32" width="28" height="3" fill="#0D0D0D" />
      <rect x="18" y="40" width="20" height="3" fill="#0D0D0D" />
      <rect x="18" y="48" width="24" height="3" fill="#0D0D0D" />

      {/* Brand text */}
      <text x="70" y="50" className="logo-text-main">
        webresume
      </text>

      {/* .now badge shadow */}
      <rect
        x="278"
        y="25"
        width="70"
        height="36"
        rx="4"
        transform="rotate(-3 278 25)"
        fill="#0D0D0D"
      />

      {/* .now badge */}
      <rect
        x="274"
        y="21"
        width="70"
        height="36"
        rx="4"
        transform="rotate(-3 274 21)"
        fill="#FF6B6B"
        stroke="#0D0D0D"
        strokeWidth="3"
      />
      <text x="282" y="46" className="logo-text-tld" transform="rotate(-3 282 46)">
        .now
      </text>
    </svg>
  );
}
