/**
 * Pure data module for theme IDs, metadata, and type guards.
 * ZERO component imports — safe for API routes, client components, and anywhere
 * that should not pull in template component bundles.
 */

export const THEME_IDS = [
  "bento",
  "bold_corporate",
  "glass",
  "midnight",
  "minimalist_editorial",
  "neo_brutalist",
  "spotlight",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "minimalist_editorial";

/**
 * Type guard to check if a string is a valid ThemeId
 */
export function isValidThemeId(id: string): id is ThemeId {
  return (THEME_IDS as readonly string[]).includes(id);
}

/**
 * Theme metadata for UI display
 */
export const THEME_METADATA: Record<
  ThemeId,
  {
    readonly name: string;
    readonly description: string;
    readonly category: string;
    readonly preview: string;
  }
> = {
  bento: {
    name: "Bento Grid",
    description: "Modern mosaic layout with colorful cards",
    category: "Modern",
    preview: "/previews/bento.png",
  },
  bold_corporate: {
    name: "Bold Corporate",
    description: "Executive typography with bold numbered sections",
    category: "Professional",
    preview: "/previews/bold-corporate.png",
  },
  glass: {
    name: "Glass Morphic",
    description: "Dark theme with frosted glass effects",
    category: "Modern",
    preview: "/previews/glass.png",
  },
  midnight: {
    name: "Midnight",
    description: "Dark minimal with serif headings and gold accents",
    category: "Modern",
    preview: "/previews/midnight.png",
  },
  minimalist_editorial: {
    name: "Minimalist Editorial",
    description: "Clean magazine-style layout with serif typography",
    category: "Professional",
    preview: "/previews/minimalist.png",
  },
  neo_brutalist: {
    name: "Neo Brutalist",
    description: "Bold design with thick borders and loud colors",
    category: "Creative",
    preview: "/previews/brutalist.png",
  },
  spotlight: {
    name: "Spotlight",
    description: "Warm creative portfolio with animated sections",
    category: "Creative",
    preview: "/previews/spotlight.png",
  },
} as const;
