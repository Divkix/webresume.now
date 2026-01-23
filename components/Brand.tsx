import { siteConfig } from "@/lib/config/site";

type BrandSize = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

interface BrandProps {
  /** Size variant */
  size?: BrandSize;
  /** Additional wrapper classes */
  className?: string;
  /** Show the tagline below */
  showTagline?: boolean;
}

const sizeClasses: Record<BrandSize, { text: string; accent: string }> = {
  xs: { text: "text-xs", accent: "text-[10px] px-1 py-0.5" },
  sm: { text: "text-sm", accent: "text-xs px-1.5 py-0.5" },
  md: { text: "text-xl", accent: "text-lg px-2 py-0.5" },
  lg: { text: "text-2xl", accent: "text-xl px-2 py-1" },
  xl: { text: "text-4xl", accent: "text-3xl px-3 py-1" },
  hero: {
    text: "text-5xl sm:text-6xl lg:text-7xl",
    accent: "text-4xl sm:text-5xl lg:text-6xl px-3 py-1",
  },
};

/**
 * Brand logo component with neubrutalist styling
 * Features a highlighted TLD like a marker on paper
 */
export function Brand({ size = "lg", className = "", showTagline = false }: BrandProps) {
  const { text, accent } = sizeClasses[size];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span className={`font-black tracking-tight ${text} text-ink`}>
        {siteConfig.name}
        <span
          className={`
            ${accent}
            ml-0.5
            bg-coral
            text-white
            font-black
            inline-block
            transform
            -rotate-1
            border-2
            border-ink
          `}
        >
          {siteConfig.tld}
        </span>
      </span>
      {showTagline && (
        <span className="text-sm font-mono text-[#6B6B6B] mt-1 tracking-wide">
          {siteConfig.tagline}
        </span>
      )}
    </div>
  );
}
