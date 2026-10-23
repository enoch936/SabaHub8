"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { 
  Search, 
  X, 
  Sparkles, 
  Briefcase, 
  Users, 
  Layers, 
  Zap, 
  Megaphone,
  ArrowRight,
  TrendingUp,
  History,
  Command
} from "lucide-react";
import { clsx } from "clsx";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [intent, setIntent] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
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
      setIntent(null);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const { data } = await api.get("/employer/global-search", {
          params: { q: query, limit: 10 }
        });
        setResults(data.results || []);
        setIntent(data.intent);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed";
        setSearchError(message);
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Job": return <Briefcase className="w-4 h-4 text-blue-500" />;
      case "Talent": return <Users className="w-4 h-4 text-purple-500" />;
      case "Project": return <Layers className="w-4 h-4 text-emerald-500" />;
      case "Announcement": return <Megaphone className="w-4 h-4 text-rose-500" />;
      default: return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      {/* Search Input Bar */}
      <div className={clsx(
        "relative flex items-center transition-all duration-500 rounded-[32px] border group",
        isOpen ? "bg-white border-indigo-200 shadow-2xl shadow-indigo-500/10" : "bg-gray-100/50 border-transparent hover:bg-gray-100"
      )}>
        <div className="pl-6 text-gray-400">
           <Search className={clsx("w-5 h-5 transition-colors", isOpen && "text-indigo-600")} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search jobs, talents, projects or ask AI anything..."
          className="w-full py-5 px-4 bg-transparent outline-none text-[15px] font-medium text-gray-950 placeholder:text-gray-400"
        />
        <div className="pr-6 flex items-center gap-3">
           {!query && (
             <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-gray-200/50 rounded-lg border border-gray-300/30">
                <Command className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">K</span>
             </div>
           )}
           {query && (
             <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
             </button>
           )}
           <div className="h-6 w-px bg-gray-200" />
           <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {/* Search Content */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-6">
            
            {loading && (
              <div className="py-10 flex flex-col items-center gap-4">
                 <div className="h-10 w-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">AI Thinking...</span>
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="space-y-6">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 px-2">Recent Searches</h4>
                    <div className="flex flex-wrap gap-2">
                       {["UI Designer", "React Native Expert", "Video Editor"].map(s => (
                         <button key={s} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                            <History className="w-3 h-3" />
                            {s}
                         </button>
                       ))}
                    </div>
                 </div>
                 
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 px-2">Trending Now</h4>
                    <div className="grid grid-cols-2 gap-3">
                       {["Full Stack Web3", "Social Media Manager", "Motion Graphics", "Content Strategist"].map(t => (
                         <div key={t} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md transition-all cursor-pointer group border border-transparent hover:border-indigo-100">
                            <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-indigo-600">
                               <TrendingUp className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-gray-700">{t}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}

            {searchError && (
              <div className="p-4 bg-red-50 rounded-3xl border border-red-100 flex items-start gap-3">
                <div className="h-8 w-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Search Unavailable</div>
                  <p className="text-sm font-medium text-red-700">{searchError}</p>
                </div>
              </div>
            )}

            {!loading && !searchError && results.length > 0 && (
              <div className="space-y-6">
                {intent && (
                  <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 flex items-start gap-3">
                     <Sparkles className="w-5 h-5 text-indigo-600 mt-1" />
                     <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">AI Search Intent</div>
                        <p className="text-sm font-medium text-indigo-900 leading-tight">I understand you're looking for <span className="font-black">"{intent}"</span>. Here are the most relevant matches:</p>
                     </div>
                  </div>
                )}

                <div className="space-y-2">
                  {results.map((res, i) => (
                    <div key={res.id} className="group flex items-center justify-between p-4 bg-white rounded-3xl hover:bg-gray-50 transition-all cursor-pointer border border-transparent hover:border-gray-100">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-white shadow-sm transition-colors">
                             {getTypeIcon(res.type)}
                          </div>
                          <div>
                             <h5 className="text-sm font-black text-gray-950 group-hover:text-indigo-600 transition-colors">{res.title}</h5>
                             <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">{res.type}</p>
                          </div>
                       </div>
                       <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && !searchError && query.length >= 2 && results.length === 0 && (
              <div className="py-20 text-center">
                 <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-gray-200" />
                 </div>
                 <h4 className="text-lg font-black text-gray-950 uppercase">No results found</h4>
                 <p className="text-sm text-gray-500 font-medium mt-2">Try a different keyword or search query.</p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Semantic AI Search Active</span>
             </div>
             <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800">Advanced Filters</button>
          </div>
        </div>
      )}
    </div>
  );
}
