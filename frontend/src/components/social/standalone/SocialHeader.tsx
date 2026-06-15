"use client";

import { Search, Bell, MessageSquare, Plus, PlusCircle } from "lucide-react";
import { Typography, Avatar, Button, cn } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";

export function SocialHeader() {
  const user = useSession((s) => s.user);
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <header 
      className={cn(
        "h-20 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-300",
        isDark ? "bg-black border-b border-white/5" : "bg-white border-b border-slate-100"
      )}
    >
      {/* Search Area */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search professionals, reels, or trends..."
            className={cn(
              "w-full border rounded-2xl py-3 pl-12 pr-4 transition-all outline-none text-sm font-bold",
              isDark 
                ? "bg-transparent border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50" 
                : "bg-transparent border-slate-200 text-black placeholder:text-slate-400 focus:border-primary/50"
            )}
          />
        </div>
      </div>

      {/* Actions Area */}
      <div className="flex items-center gap-2 sm:gap-6 ml-4">
        <div className="hidden sm:flex items-center gap-1">
          <Button variant="text" size="sm" className="h-11 w-11 p-0 rounded-2xl hover:bg-primary/5 group">
             <PlusCircle size={22} className="text-slate-500 group-hover:text-primary transition-colors" />
          </Button>
          <Button variant="text" size="sm" className="h-11 w-11 p-0 rounded-2xl hover:bg-primary/5 group">
             <MessageSquare size={22} className="text-slate-500 group-hover:text-primary transition-colors" />
          </Button>
          <Button variant="text" size="sm" className="h-11 w-11 p-0 rounded-2xl hover:bg-primary/5 group relative">
             <Bell size={22} className="text-slate-500 group-hover:text-primary transition-colors" />
             <span className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full ring-2 ring-white dark:ring-black" />
          </Button>
        </div>

        <div className={cn(
          "flex items-center gap-3 pl-2 sm:pl-6 border-l",
          isDark ? "border-white/5" : "border-slate-100"
        )}>
           <div 
             onClick={() => router.push(`/social/profile/${user?.id}`)}
             className="text-right hidden md:block cursor-pointer"
           >
              <Typography variant="subtitle2" fontWeight={900} className="leading-none dark:text-white">{user?.fullName}</Typography>
              <Typography variant="caption" className="text-primary font-bold uppercase tracking-wider text-[10px]">Verified Expert</Typography>
           </div>
           <div 
             onClick={() => router.push(`/social/profile/${user?.id}`)}
             className="relative group cursor-pointer"
           >
             <Avatar 
                src={user?.profilePictureUrl || undefined} 
                alt={user?.fullName} 
                size="md" 
                className="border-2 border-primary/20 group-hover:border-primary transition-colors" 
             />
             <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-black" />
           </div>
        </div>
      </div>
    </header>
  );
}
