/**
 * Site configuration - reads from environment variables
 * Change branding by updating NEXT_PUBLIC_* env vars
 */

const name = process.env.NEXT_PUBLIC_SITE_NAME || "clickfolio";
const tld = process.env.NEXT_PUBLIC_SITE_TLD || ".me";
const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN || "clickfolio.me";

export const siteConfig = {
  /** Main brand name (e.g., "clickfolio") */
  name,
  /** TLD/suffix (e.g., ".me") */
  tld,
  /** Full domain (e.g., "clickfolio.me") */
  domain,
  /** Combined name + tld */
  fullName: `${name}${tld}`,
  /** Marketing tagline */
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || "Turn your resume into a website",
  /** Support email address */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || `support@${domain}`,
  /** Full URL with protocol */
  url: `https://${domain}`,
} as const;
