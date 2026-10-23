"use client";

import { DisputesWorkspace } from "@/components/contracts/DisputesWorkspace";
import { useSession } from "@/lib/session";

export default function WorkspaceDisputesPage() {
  const role = useSession((s) => s.role);
  
  return <DisputesWorkspace userRole={role === "ADMIN" ? "ADMIN" : role === "EMPLOYER" ? "EMPLOYER" : "FREELANCER"} />;
}
