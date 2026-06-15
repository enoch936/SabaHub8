"use client";

import { Typography } from "@/components/ui";

export default function SocialFollowingPage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <Typography variant="h4" fontWeight={900} className="tracking-tight uppercase">Following</Typography>
      <Typography variant="body1" className="text-slate-500 max-w-md font-medium">
        Manage the professionals and creators you follow.
      </Typography>
    </div>
  );
}
