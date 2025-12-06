import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { SidebarLayoutClient } from "./SidebarLayoutClient";

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
