"use client";

import { Typography } from "@/components/ui";

export default function SocialMyReelsPage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <Typography variant="h4" fontWeight={900} className="tracking-tight uppercase">My Reels</Typography>
      <Typography variant="body1" className="text-slate-500 max-w-md font-medium">
        Manage and view your published professional reels.
      </Typography>
    </div>
  );
}
