"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerificationSettingsRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const step = searchParams.get("step");
    const section = step === "phone" || step === "email" ? "verification" : "security";
    router.replace(`/jobs/settings?section=${section}`);
  }, [router, searchParams]);

  return <div className="text-sm text-gray-500">Opening verification settings...</div>;
}
