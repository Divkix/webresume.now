type LogoIconSize = "xs" | "sm" | "md" | "lg" | "xl";
type LogoIconColorScheme = "dark" | "light";

interface LogoIconProps {
  /** Size variant */
  size?: LogoIconSize;
  /** Color scheme for different backgrounds */
  colorScheme?: LogoIconColorScheme;
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

const colorConfig: Record<
  LogoIconColorScheme,
  { document: string; lines: string; cursor: string; cursorStroke: string }
> = {
  dark: { document: "#FF6B6B", lines: "#FFFFFF", cursor: "#FFFFFF", cursorStroke: "#FF6B6B" },
  light: { document: "#FFFFFF", lines: "#FF6B6B", cursor: "#FFFFFF", cursorStroke: "#FF6B6B" },
};

/**
 * Icon-only version of the logo (coral document with cursor)
 * Use for favicons, small spaces, or alongside text
 */
export function LogoIcon({ size = "md", colorScheme = "dark", className = "" }: LogoIconProps) {
  const dimension = sizeConfig[size];
  const colors = colorConfig[colorScheme];

  // Use unique filter ID to avoid conflicts when multiple icons render
  const filterId = `shadow-${size}-${colorScheme}`;

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="clickfolio.me icon"
      role="img"
    >
      {/* Drop shadow filter for cursor */}
      <defs>
        <filter id={filterId}>
          <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Coral document body */}
      <rect x="5" y="5" width="40" height="50" rx="8" fill={colors.document} />

      {/* White text lines */}
      <path d="M17 18H33" stroke={colors.lines} strokeWidth="3" strokeLinecap="round" />
      <path d="M17 26H33" stroke={colors.lines} strokeWidth="3" strokeLinecap="round" />
      <path d="M17 34H25" stroke={colors.lines} strokeWidth="3" strokeLinecap="round" />

      {/* Cursor/pointer element */}
      <path
        d="M33 32L41 50L45 40L55 36L33 32Z"
        fill={colors.cursor}
        stroke={colors.cursorStroke}
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ filter: `url(#${filterId})` }}
      />
    </svg>
  );
}
