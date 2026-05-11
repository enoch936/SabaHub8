"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContactSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/jobs/settings?section=contact");
  }, [router]);

  return <div className="text-sm text-gray-500">Opening contact settings...</div>;
}
