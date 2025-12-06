import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EditResumeFormWrapper } from "@/components/forms/EditResumeFormWrapper";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { siteData } from "@/lib/db/schema";
import type { ResumeContent } from "@/lib/types/database";

export default async function EditPage() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  // Fetch user's site data
  const siteDataResult = await db.query.siteData.findFirst({
    where: eq(siteData.userId, session.user.id),
  });

  // If no site data exists, redirect to dashboard
  if (!siteDataResult) {
    redirect("/dashboard");
  }

  // Parse content JSON (stored as text in D1)
  const content = JSON.parse(siteDataResult.content) as ResumeContent;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Edit Resume</h1>
          <p className="text-slate-600 mt-2">Update your resume content and publish changes</p>
        </div>
        <EditResumeFormWrapper initialData={content} />
      </div>
    </div>
  );
}
