import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  return process.env.BETTER_AUTH_URL || "https://clickfolio.me";
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/edit/", "/settings/", "/waiting/", "/wizard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
