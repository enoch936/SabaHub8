"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SocialRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/social/feed");
  }, [router]);

  return null;
}
