"use client";

import { Typography, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { Feed } from "@/components/social/Feed";
import { useSession } from "@/lib/session";
import { Bookmark } from "lucide-react";

export default function SocialSavedPage() {
  const user = useSession((s) => s.user);

  if (!user?.id) return <LoadingState label="Loading user" />;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark size={24} className="text-primary" />
        <Typography variant="h4" fontWeight={900} className="uppercase tracking-tight">
          Saved Posts
        </Typography>
      </div>
      <Feed mode="user" userId={user.id} filter="saved" />
    </div>
  );
}
