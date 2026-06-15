"use client";

import { Typography } from "@/components/ui";

export default function SocialSavedPage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <Typography variant="h4" fontWeight={900} className="tracking-tight uppercase">Saved Posts</Typography>
      <Typography variant="body1" className="text-slate-500 max-w-md font-medium">
        Your curated collection of professional insights and reels.
      </Typography>
    </div>
  );
}
