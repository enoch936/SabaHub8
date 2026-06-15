"use client";

import { Typography } from "@/components/ui";

export default function SocialExplorePage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
         <Typography variant="h3" className="text-primary font-black italic">S</Typography>
      </div>
      <Typography variant="h4" fontWeight={900} className="tracking-tight uppercase">Explore Trends</Typography>
      <Typography variant="body1" className="text-slate-500 max-w-md font-medium">
        Discover the most influential professional trends and creators in the SabaHub ecosystem.
      </Typography>
      <div className="mt-8 px-6 py-3 border border-primary/20 rounded-2xl text-primary font-black text-[12px] tracking-[0.2em] uppercase">
         Coming Early 2026
      </div>
    </div>
  );
}
