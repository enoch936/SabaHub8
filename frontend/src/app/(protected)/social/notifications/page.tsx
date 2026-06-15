"use client";

import { Typography } from "@/components/ui";

export default function SocialNotificationsPage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <Typography variant="h4" fontWeight={900} className="tracking-tight uppercase">Notifications</Typography>
      <Typography variant="body1" className="text-slate-500 max-w-md font-medium">
        Stay updated with likes, comments, and new followers.
      </Typography>
    </div>
  );
}
