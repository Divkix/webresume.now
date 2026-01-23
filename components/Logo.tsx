import { LogoIcon } from "./LogoIcon";
import { LogoText } from "./LogoText";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
type LogoVariant = "full" | "icon" | "text";

interface LogoProps {
  /** Size variant */
  size?: LogoSize;
  /** Which parts to render */
  variant?: LogoVariant;
  /** Additional classes */
  className?: string;
}

// Size mappings for composed layout
const iconSizeMap: Record<LogoSize, "xs" | "sm" | "md" | "lg" | "xl"> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

const textSizeMap: Record<LogoSize, "xs" | "sm" | "md" | "lg" | "xl"> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

const gapMap: Record<LogoSize, string> = {
  xs: "gap-1",
  sm: "gap-1.5",
  md: "gap-2",
  lg: "gap-2.5",
  xl: "gap-3",
};

/**
 * Composable logo component
 *
 * - variant="full" (default): Icon + Text
 * - variant="icon": Just the document icon
 * - variant="text": Just the text with badge
 */
export function Logo({ size = "md", variant = "full", className = "" }: LogoProps) {
  if (variant === "icon") {
    return <LogoIcon size={iconSizeMap[size]} className={className} />;
  }

  if (variant === "text") {
    return <LogoText size={textSizeMap[size]} className={className} />;
  }

  // Full logo: compose icon + text
  return (
    <div className={`inline-flex items-center ${gapMap[size]} ${className}`}>
      <LogoIcon size={iconSizeMap[size]} />
      <LogoText size={textSizeMap[size]} />
    </div>
  );
}

// Re-export individual components for direct use
export { LogoIcon } from "./LogoIcon";
export { LogoText } from "./LogoText";
