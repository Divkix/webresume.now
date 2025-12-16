import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeSelector } from "@/components/dashboard/ThemeSelector";
import { getAuth } from "@/lib/auth";
import { siteConfig } from "@/lib/config/site";
import { getDb } from "@/lib/db";
import { siteData } from "@/lib/db/schema";

export const metadata = {
  title: `Themes | ${siteConfig.fullName}`,
  description: "Choose your resume theme",
};

export default async function ThemesPage() {
  // 1. Check authentication via Better Auth
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/");
  }

  // 2. Get database connection
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  // 3. Fetch user's current theme
  const userSiteData = await db.query.siteData.findFirst({
    where: eq(siteData.userId, session.user.id),
    columns: { themeId: true },
  });

  const currentThemeId = userSiteData?.themeId || "minimalist_editorial";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Choose Your Theme
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Customize how your resume appears to visitors. Each theme offers a unique visual style.
          </p>
        </div>

        {/* Theme Selector */}
        <ThemeSelector initialThemeId={currentThemeId} />
      </div>
    </div>
  );
}
