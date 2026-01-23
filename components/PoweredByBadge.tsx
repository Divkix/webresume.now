import { cva, type VariantProps } from "class-variance-authority";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

const poweredByBadgeVariants = cva("inline-flex items-center gap-1.5 transition-all no-underline", {
  variants: {
    variant: {
      minimalist_editorial: "text-xs text-neutral-400 hover:text-neutral-600 [&:hover]:underline",
      neo_brutalist:
        "font-bold text-sm border-3 border-black px-3 py-1.5 bg-[#FFDE00] shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]",
      glassmorphic:
        "text-sm text-white/60 backdrop-blur-sm bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 hover:text-white/80",
      bento_grid:
        "text-xs text-neutral-600 border border-neutral-200 rounded-lg px-3 py-1.5 hover:bg-neutral-50 hover:border-neutral-300",
    },
  },
  defaultVariants: {
    variant: "minimalist_editorial",
  },
});

type LogoSize = "xs" | "sm";
type LogoColorScheme = "dark" | "light";

const variantLogoConfig: Record<
  NonNullable<VariantProps<typeof poweredByBadgeVariants>["variant"]>,
  { size: LogoSize; colorScheme: LogoColorScheme }
> = {
  minimalist_editorial: { size: "xs", colorScheme: "dark" },
  neo_brutalist: { size: "xs", colorScheme: "dark" },
  glassmorphic: { size: "xs", colorScheme: "light" },
  bento_grid: { size: "xs", colorScheme: "dark" },
};

export interface PoweredByBadgeProps extends VariantProps<typeof poweredByBadgeVariants> {
  className?: string;
}

export function PoweredByBadge({
  variant = "minimalist_editorial",
  className,
}: PoweredByBadgeProps) {
  const safeVariant = variant ?? "minimalist_editorial";
  const { size, colorScheme } = variantLogoConfig[safeVariant];

  return (
    <a
      href={siteConfig.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(poweredByBadgeVariants({ variant }), className)}
    >
      <span>Powered by</span>
      <Logo size={size} colorScheme={colorScheme} />
    </a>
  );
}
