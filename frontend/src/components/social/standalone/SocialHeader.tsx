"use client";

import { Search, Bell, MessageSquare, Plus, PlusCircle, X, User as UserIcon, ArrowRight } from "lucide-react";
import { Typography, Avatar, Button, cn } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { searchUsersByName } from "@/lib/api";

export function SocialHeader() {
  const user = useSession((s) => s.user);
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchUsersByName(query);
        setResults(data.results || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (userId: string) => {
    router.push(`/social/profile/${userId}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <header 
      className={cn(
        "h-20 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-300",
        isDark ? "bg-black border-b border-white/5" : "bg-white border-b border-slate-100"
      )}
    >
      {/* Search Area */}
      <div className="flex-1 max-w-xl relative" ref={searchRef}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className={cn("text-slate-400 group-focus-within:text-primary transition-colors", isOpen && "text-primary")} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search professionals by username or name..."
            className={cn(
              "w-full border rounded-2xl py-3 pl-12 pr-10 transition-all outline-none text-sm font-bold",
              isDark 
                ? "bg-transparent border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50" 
                : "bg-transparent border-slate-200 text-black placeholder:text-slate-400 focus:border-primary/50",
              isOpen && results.length > 0 && "rounded-b-none border-b-transparent"
            )}
          />
          {query && (
            <button 
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && (query.length >= 2) && (
          <div className={cn(
            "absolute top-full left-0 right-0 border rounded-b-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300",
            isDark ? "bg-slate-900 border-white/10 shadow-black" : "bg-white border-slate-200 shadow-slate-200/50"
          )}>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 flex flex-col items-center gap-3">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Searching Network...</span>
                </div>
              ) : results.length > 0 ? (
                <div className="p-2 space-y-1">
                  {results.map((res) => (
                    <div 
                      key={res.id} 
                      onClick={() => handleResultClick(res.id)}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                        isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar 
                          src={res.profilePictureUrl} 
                          alt={res.fullName} 
                          size="sm" 
                          className="border border-slate-100 dark:border-white/10"
                        />
                        <div>
                          <Typography variant="subtitle2" fontWeight={900} className="leading-none dark:text-white group-hover:text-primary transition-colors">
                            {res.fullName}
                          </Typography>
                          <Typography variant="caption" className="text-slate-500 font-bold tracking-tight">
                            @{res.username || "professional"}
                          </Typography>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <Typography variant="body2" className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">No professionals found</Typography>
                </div>
              )}
            </div>
            
            <div className={cn(
              "px-4 py-2 border-t text-[10px] font-black uppercase tracking-[0.2em]",
              isDark ? "bg-black/40 border-white/5 text-slate-600" : "bg-slate-50 border-slate-100 text-slate-400"
            )}>
              Press Enter to see all results
            </div>
          </div>
        )}
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
