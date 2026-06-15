"use client";

import { Typography } from "@/components/ui";

export default function SocialFollowersPage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <Typography variant="h4" fontWeight={900} className="tracking-tight uppercase">Followers</Typography>
      <Typography variant="body1" className="text-slate-500 max-w-md font-medium">
        See who is following your professional journey.
      </Typography>
    </div>
  );
}
