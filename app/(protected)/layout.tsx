import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { SidebarLayoutClient } from "./SidebarLayoutClient";

// Force dynamic rendering - protected routes require runtime auth context
// which isn't available during build-time prerendering
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();

  // Check authentication via Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return <SidebarLayoutClient>{children}</SidebarLayoutClient>;
}
