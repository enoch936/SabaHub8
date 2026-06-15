"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Search, 
  PlaySquare, 
  PlusSquare, 
  Bell, 
  MessageCircle, 
  Users, 
  UserPlus, 
  Bookmark, 
  Heart, 
  Film, 
  User, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { Typography, cn } from "@/components/ui";
import { useSession } from "@/lib/session";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { CreatePostModal } from "../CreatePostModal";

export function SocialSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession((s) => s.user);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Auto-collapse on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 768) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1280) {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { icon: Home, label: "Home Feed", href: "/social/feed" },
    { icon: Search, label: "Explore", href: "/social/explore" },
    { icon: PlaySquare, label: "Reels", href: "/social/reels" },
    { icon: PlusSquare, label: "Create Post", action: "create" },
    { icon: Bell, label: "Notifications", href: "/social/notifications" },
    { icon: MessageCircle, label: "Messages", href: "/chat" },
    { icon: Users, label: "Following", href: "/social/following" },
    { icon: UserPlus, label: "Followers", href: "/social/followers" },
    { icon: Bookmark, label: "Saved Posts", href: "/social/saved" },
    { icon: Heart, label: "Liked Posts", href: "/social/liked" },
    { icon: Film, label: "My Reels", href: "/social/my-reels" },
    { icon: User, label: "My Profile", href: `/social/profile/${user?.id}` },
    { icon: Settings, label: "Settings", href: "/social/settings" },
  ];

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 88 }
  };

  const navItem = (item: any) => {
    const isActive = item.href ? (pathname === item.href || (item.href !== "/social/feed" && pathname.startsWith(item.href))) : false;
    const Icon = item.icon;

    const content = (
      <div className={cn(
        "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group cursor-pointer",
        isActive 
          ? "text-primary" 
          : "text-slate-500 hover:text-black dark:hover:text-white"
      )}>
        {isActive && (
          <motion.div 
            layoutId="activeNav"
            className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-2xl -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        
        <div className={cn(
          "transition-all duration-300 group-hover:scale-110 shrink-0",
          isActive ? "text-primary stroke-[2.5px]" : "stroke-[2px]"
        )}>
          <Icon size={24} />
        </div>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={cn(
                "font-bold text-[15px] whitespace-nowrap",
                isActive ? "text-primary" : ""
              )}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {item.badge && !isCollapsed && (
          <span className="ml-auto bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-4 ring-white dark:ring-black">
            {item.badge}
          </span>
        )}

        {item.badge && isCollapsed && (
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-primary rounded-full ring-2 ring-white dark:ring-black" />
        )}
      </div>
    );

    if (item.action === "create") {
      return (
        <button key={item.label} onClick={() => setIsCreateModalOpen(true)} className="w-full text-left">
          {content}
        </button>
      );
    }

    return (
      <Link key={item.label} href={item.href || "#"} className="block">
        {content}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="h-14 w-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Menu size={24} />
        </button>
      </div>

      <motion.aside
        initial="expanded"
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        className={cn(
          "h-screen border-r flex flex-col fixed left-0 top-0 z-40 bg-white dark:bg-black transition-colors duration-300",
          isDark ? "border-white/5" : "border-slate-100",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Area */}
        <div className="h-20 flex items-center px-6 mb-4 shrink-0 overflow-hidden">
          <Link href="/social/feed" className="flex items-center gap-3">
             <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <Typography variant="h5" className="text-white font-black italic">S</Typography>
             </div>
             {!isCollapsed && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col"
               >
                 <Typography variant="h6" fontWeight={900} className="tracking-tighter leading-none dark:text-white">SabaSocial</Typography>
                 <Typography variant="caption" className="text-primary font-bold tracking-widest uppercase text-[9px]">Connect</Typography>
               </motion.div>
             )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar-none">
          {menuItems.map(navItem)}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 space-y-2 shrink-0 border-t border-slate-100 dark:border-white/5 bg-inherit">
           <button 
             onClick={() => router.push("/dashboard")}
             className={cn(
               "flex items-center gap-4 px-4 py-3.5 rounded-2xl w-full transition-all duration-300 group",
               "text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500"
             )}
           >
             <LogOut size={24} className="shrink-0" />
             {!isCollapsed && <span className="font-bold text-[15px]">Exit Social</span>}
           </button>

           <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="hidden md:flex items-center gap-4 px-4 py-3.5 rounded-2xl w-full text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300"
           >
             {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
             {!isCollapsed && <span className="font-bold text-[15px]">Collapse</span>}
           </button>
        </div>
      </motion.aside>

      {/* Spacer to push content */}
      <div 
        className={cn(
          "hidden md:block shrink-0 transition-all duration-300",
          isCollapsed ? "w-[88px]" : "w-[280px]"
        )} 
      />
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <CreatePostModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onPostSuccess={() => {
           // If we are on the feed page, we might want to refresh it
           // But since we use a global feed state or key in the feed page, 
           // we can use a custom event or just let the user refresh.
           // For now, toast will suffice.
        }}
      />
    </>
  );
}
