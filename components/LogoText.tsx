type LogoTextSize = "xs" | "sm" | "md" | "lg" | "xl";
type LogoTextColorScheme = "dark" | "light";

interface LogoTextProps {
  /** Size variant */
  size?: LogoTextSize;
  /** Color scheme for different backgrounds */
  colorScheme?: LogoTextColorScheme;
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

const colorConfig: Record<LogoTextColorScheme, { main: string; shadow: string; stroke: string }> = {
  dark: { main: "#0D0D0D", shadow: "#0D0D0D", stroke: "#0D0D0D" },
  light: { main: "#FFFFFF", shadow: "rgba(0,0,0,0.3)", stroke: "#FFFFFF" },
};

/**
 * Text-only portion of the logo (webresume + .now badge)
 * Use alongside LogoIcon or standalone
 */
export function LogoText({ size = "md", colorScheme = "dark", className = "" }: LogoTextProps) {
  const { width, height } = sizeConfig[size];
  const colors = colorConfig[colorScheme];

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
          {`.logotext-main-${colorScheme} { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 36px; fill: ${colors.main}; }
          .logotext-tld { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 24px; fill: #FFFFFF; }`}
        </style>
      </defs>

      {/* Brand text "webresume" */}
      <text x="0" y="40" className={`logotext-main-${colorScheme}`}>
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
        fill={colors.shadow}
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
        stroke={colors.stroke}
        strokeWidth="3"
      />
      <text x="212" y="36" className="logotext-tld" transform="rotate(-3 212 36)">
        .now
      </text>
    </svg>
  );
}
