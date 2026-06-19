"use client";

import { useEffect, useState, useRef } from "react";
import { 
  getDiscoveryFeed, 
  type DiscoveryFeedItem 
} from "@/lib/api";
import { 
  Briefcase, 
  Users, 
  Layers, 
  Zap, 
  FileText, 
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  Trophy,
  Megaphone,
  BellRing
} from "lucide-react";
import { clsx } from "clsx";

const CATEGORIES = [
  { id: "All", label: "All Content", icon: <Layers className="h-4 w-4" /> },
  { id: "Job", label: "Jobs", icon: <Briefcase className="h-4 w-4" /> },
  { id: "Talent", label: "Talents", icon: <Users className="h-4 w-4" /> },
  { id: "Project", label: "Projects", icon: <Layers className="h-4 w-4" /> },
  { id: "Opportunity", label: "Opportunities", icon: <Zap className="h-4 w-4" /> },
  { id: "Announcement", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
  { id: "Post", label: "Posts", icon: <FileText className="h-4 w-4" /> },
];

export function DiscoveryFeed() {
  const [items, setItems] = useState<DiscoveryFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchFeed = async (reset = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const newOffset = reset ? 0 : offset;
      const data = await getDiscoveryFeed(activeCategory, 20, newOffset);
      
      if (reset) {
        setItems(data);
        setOffset(data.length);
      } else {
        setItems(prev => [...prev, ...data]);
        setOffset(prev => prev + data.length);
      }
      
      setHasMore(data.length === 20);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load discovery feed";
      setError(message);
      console.error("Failed to fetch discovery feed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchFeed(true);
  }, [activeCategory]);

  const lastItemRef = (node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        void fetchFeed();
      }
    });
    
    if (node) observer.current.observe(node);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Universal Filter */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setOffset(0);
              setHasMore(true);
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeCategory === cat.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105"
                : "bg-white border border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"
            )}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, index) => {
          if (items.length === index + 1) {
            return (
              <div ref={lastItemRef} key={`${item.type}-${item.id}-${index}`}>
                <DiscoveryCard item={item} />
              </div>
            );
          } else {
            return <DiscoveryCard key={`${item.type}-${item.id}-${index}`} item={item} />;
          }
        })}

        {isLoading && Array(3).fill(0).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-96 rounded-[40px] bg-gray-50 animate-pulse border border-gray-100" />
        ))}
      </div>

      {error && (
        <div className="text-center py-16 bg-red-50 rounded-[48px] border-2 border-red-200 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest mb-4">
            Connection Error
          </div>
          <p className="text-red-600 font-medium max-w-md mx-auto">{error}</p>
          <button
            onClick={() => { setError(null); void fetchFeed(true); }}
            className="mt-6 px-8 py-3 bg-red-600 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="text-center py-32 bg-gray-50 rounded-[48px] border-2 border-dashed border-gray-200">
          <div className="relative inline-block mb-6">
             <Sparkles className="h-16 w-16 text-indigo-200" />
             <div className="absolute inset-0 animate-ping opacity-20">
                <Sparkles className="h-16 w-16 text-indigo-500" />
             </div>
          </div>
          <h3 className="text-2xl font-black text-gray-950 uppercase tracking-tighter">Nothing in orbit yet</h3>
          <p className="text-gray-500 font-medium max-w-xs mx-auto mt-2">The AI is searching the galaxy for {activeCategory.toLowerCase()} content. Try another filter.</p>
          <button 
            onClick={() => setActiveCategory("All")}
            className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-500/20"
          >
            Show Everything
          </button>
        </div>
      )}

      {items.length > 0 && !hasMore && (
        <div className="text-center py-10 opacity-40">
           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">You've reached the edge of the universe</div>
        </div>
      )}
    </div>
  );
}

function DiscoveryCard({ item }: { item: DiscoveryFeedItem }) {
  const getBadgeConfig = (type: string) => {
    switch (type) {
      case "Job": return { color: "bg-blue-50 text-blue-600", icon: <Briefcase className="h-3 w-3" />, glow: "bg-blue-500" };
      case "Talent": return { color: "bg-purple-50 text-purple-600", icon: <Users className="h-3 w-3" />, glow: "bg-purple-500" };
      case "Project": return { color: "bg-emerald-50 text-emerald-600", icon: <Layers className="h-3 w-3" />, glow: "bg-emerald-500" };
      case "Opportunity": return { color: "bg-amber-50 text-amber-600", icon: <Zap className="h-3 w-3" />, glow: "bg-amber-500" };
      case "Post": return { color: "bg-rose-50 text-rose-600", icon: <FileText className="h-3 w-3" />, glow: "bg-rose-500" };
      case "Announcement": return { color: "bg-indigo-50 text-indigo-600", icon: <Megaphone className="h-3 w-3" />, glow: "bg-indigo-500" };
      case "CommunityUpdate": return { color: "bg-cyan-50 text-cyan-600", icon: <BellRing className="h-3 w-3" />, glow: "bg-cyan-500" };
      default: return { color: "bg-gray-50 text-gray-600", icon: <Sparkles className="h-3 w-3" />, glow: "bg-gray-500" };
    }
  };

  const config = getBadgeConfig(item.type);

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-[40px] border border-gray-100 p-7 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] hover:border-transparent transition-all duration-700 overflow-hidden isolate">
      {/* Dynamic Background Glow */}
      <div className={clsx(
        "absolute -top-32 -right-32 w-64 h-64 blur-[100px] opacity-0 group-hover:opacity-10 transition-opacity duration-1000 rounded-full -z-10",
        config.glow
      )} />

      {/* Item Type & Status Badges */}
      <div className="flex items-start justify-between mb-8">
        <div className={clsx(
          "flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest",
          config.color
        )}>
          {config.icon}
          {item.type}
        </div>
        
        <div className="flex gap-2">
           {item.isVerified && (
             <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100" title="Verified Professional">
                <CheckCircle2 className="h-4 w-4" />
             </div>
           )}
           {item.userReputation && item.userReputation.globalScore && (
             <div className="bg-amber-50 text-amber-600 px-2 py-1.5 rounded-xl border border-amber-100 flex items-center gap-1.5" title="High Reputation Score">
                <Trophy className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black">{item.userReputation.globalScore}</span>
             </div>
           )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-5">
        {item.type === "Talent" ? (
          <div className="flex items-center gap-5 mb-2">
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-gray-50 overflow-hidden border border-gray-100 shadow-sm group-hover:scale-110 transition-transform duration-700">
                <img 
                  src={item.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name || "S")}`} 
                  className="w-full h-full object-cover" 
                  alt={item.name} 
                />
              </div>
              {item.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-gray-100 shadow-sm">
                   <div className="bg-emerald-500 rounded-full p-0.5">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                   </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-950 tracking-tight leading-none mb-2">{item.name}</h3>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.professionalTitle}</p>
            </div>
          </div>
        ) : (
          <h3 className="text-2xl font-black text-gray-950 leading-[1.15] tracking-tight group-hover:text-indigo-600 transition-colors duration-500">
            {item.title}
          </h3>
        )}

        <p className="text-[15px] text-gray-500 font-medium line-clamp-3 leading-relaxed">
          {item.description}
        </p>

        {item.skills && item.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {item.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="px-3 py-1.5 bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-gray-100 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all">
                {skill}
              </span>
            ))}
            {item.skills.length > 4 && (
              <span className="text-[9px] font-black text-gray-300 flex items-center">+{item.skills.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Item Media Preview */}
      {(item.thumbnailUrl || (item.imageUrls && item.imageUrls.length > 0)) && (
        <div className="mt-8 aspect-[16/10] rounded-[28px] bg-gray-50 overflow-hidden relative group-hover:shadow-2xl transition-all duration-700">
           <img 
            src={item.thumbnailUrl || (item.imageUrls && item.imageUrls[0]) || ""} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
            alt="Preview" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
      )}

      {/* Card Footer */}
      <div className="mt-8 pt-7 border-t border-gray-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
            {item.type === "Talent" ? "Base Rate" : item.type === "Job" ? "Est. Budget" : "Valuation"}
          </span>
          <div className="flex items-baseline gap-1">
             <span className="text-2xl font-black text-gray-950 tracking-tighter">
               {item.hourlyRate ? `$${item.hourlyRate}` : item.budget ? `$${item.budget.toLocaleString()}` : item.price ? `$${item.price}` : "TBD"}
             </span>
             {item.hourlyRate && <span className="text-[10px] font-black text-gray-400 uppercase">/ hr</span>}
          </div>
        </div>
        
        <button className="h-14 w-14 rounded-3xl bg-gray-950 text-white flex items-center justify-center hover:bg-indigo-600 hover:scale-110 hover:rotate-[-5deg] transition-all duration-500 shadow-xl shadow-gray-950/20">
          <ArrowRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
