"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OldSocialPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/social/feed");
  }, [router]);

  return null;
}
