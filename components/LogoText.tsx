type LogoTextSize = "xs" | "sm" | "md" | "lg" | "xl";

interface LogoTextProps {
  /** Size variant */
  size?: LogoTextSize;
  /** Additional classes */
  className?: string;
}

const sizeConfig: Record<LogoTextSize, { width: number; height: number }> = {
  xs: { width: 100, height: 20 },
  sm: { width: 150, height: 30 },
  md: { width: 200, height: 40 },
  lg: { width: 250, height: 50 },
  xl: { width: 300, height: 60 },
};

/**
 * Text-only portion of the logo (webresume + .now badge)
 * Use alongside LogoIcon or standalone
 */
export function LogoText({ size = "md", className = "" }: LogoTextProps) {
  const { width, height } = sizeConfig[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 290 60"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="webresume.now"
      role="img"
    >
      <defs>
        <style>
          {`.logotext-main { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 36px; fill: #0D0D0D; }
          .logotext-tld { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 24px; fill: #FFFFFF; }`}
        </style>
      </defs>

      {/* Brand text "webresume" */}
      <text x="0" y="40" className="logotext-main">
        webresume
      </text>

      {/* .now badge shadow */}
      <rect
        x="208"
        y="15"
        width="70"
        height="36"
        rx="4"
        transform="rotate(-3 208 15)"
        fill="#0D0D0D"
      />

      {/* .now badge */}
      <rect
        x="204"
        y="11"
        width="70"
        height="36"
        rx="4"
        transform="rotate(-3 204 11)"
        fill="#FF6B6B"
        stroke="#0D0D0D"
        strokeWidth="3"
      />
      <text x="212" y="36" className="logotext-tld" transform="rotate(-3 212 36)">
        .now
      </text>
    </svg>
  );
}
