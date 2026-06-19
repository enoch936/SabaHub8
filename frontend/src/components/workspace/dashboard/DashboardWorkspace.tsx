"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Briefcase, 
  Users, 
  ArrowRight,
  TrendingUp,
  Zap,
  Globe,
  ShieldCheck,
  Megaphone,
  BellRing
} from "lucide-react";
import { DiscoveryFeed } from "@/components/dashboard/DiscoveryFeed";
import { Feed } from "@/components/social/Feed";
import { Stories } from "@/components/social/standalone/Stories";
import GlobalSearch from "@/components/dashboard/GlobalSearch";
import CreatorDashboard from "@/components/dashboard/CreatorDashboard";
import { workspaceRoutes } from "@/lib/workspace-routes";
import { clsx } from "clsx";

export default function DashboardWorkspace() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("discovery");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Top Header / Search Area */}
      <section className="pt-10 pb-16 px-6 dashboard-header-gradient">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-2 dashboard-pill">
                <Sparkles className="h-3.5 w-3.5" /> SabaHub Social AI Ecosystem
             </div>
             <h1 className="text-6xl md:text-7xl font-black tracking-tighter" style={{ color: "var(--foreground)" }}>
                Discover your next <span className="italic" style={{ color: "var(--primary)" }}>Big Move.</span>
             </h1>
             <p className="font-medium text-lg max-w-2xl mx-auto" style={{ color: "var(--foreground-muted)" }}>The unified discovery feed powered by AI to match you with jobs, talent, and strategic professional opportunities.</p>
          </div>
          
          <GlobalSearch />
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 border-b mb-10 overflow-x-auto no-scrollbar scroll-smooth" style={{ borderColor: "var(--border)" }}>
           {[
             { id: "discovery", label: "Discovery Feed", icon: <Sparkles className="h-4 w-4" /> },
             { id: "creator", label: "Creator Studio", icon: <TrendingUp className="h-4 w-4" /> },
             { id: "jobs", label: "Marketplace", icon: <Briefcase className="h-4 w-4" /> },
             { id: "networking", label: "Community", icon: <Users className="h-4 w-4" /> }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={clsx(
                 "flex items-center gap-2 pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap",
                 activeTab === tab.id 
                  ? "dashboard-tab-active" 
                  : "dashboard-tab-inactive"
               )}
             >
               {tab.icon}
               {tab.label}
             </button>
           ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
           {activeTab === "discovery" && <DiscoveryFeed />}
           {activeTab === "creator" && <CreatorDashboard />}
            {activeTab === "jobs" && (
              <div className="py-20 text-center">
                 <div className="h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-8 dashboard-icon-box">
                    <Briefcase className="h-10 w-10" style={{ color: "var(--primary)" }} />
                 </div>
                 <h2 className="text-3xl font-black uppercase mb-4 tracking-tight" style={{ color: "var(--foreground)" }}>Marketplace Intelligence</h2>
                 <p className="font-medium max-w-sm mx-auto" style={{ color: "var(--foreground-muted)" }}>Access 10k+ open jobs and projects with AI matching and instant proposals.</p>
                 <button 
                   onClick={() => router.push(workspaceRoutes.browseJobs || "/dashboard/jobs")}
                   className="mt-10 px-12 py-5 text-white rounded-[24px] text-xs font-black uppercase tracking-widest transition-all shadow-xl dashboard-cta-button"
                 >
                   Enter Marketplace
                 </button>
              </div>
            )}
            {activeTab === "networking" && (
              <div className="space-y-10">
                <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-6 border border-white/20 shadow-xl">
                   <div className="flex items-center gap-2 mb-6 px-4">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Active Moments</h2>
                   </div>
                   <Stories />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between px-6">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                               <Globe className="h-4 w-4 text-white" />
                            </div>
                            <h2 className="text-xl font-black tracking-tight">Global Network Feed</h2>
                         </div>
                      </div>
                      <Feed mode="global" />
                   </div>
                </div>
              </div>
            )}
        </div>
      </main>

      {/* Footer / Status Area */}
      <section className="py-24 mt-20 bg-gray-950 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
             <div>
                <h2 className="text-4xl font-black tracking-tighter mb-8 leading-tight">Built for the future <br />of Professional Social.</h2>
                <div className="flex items-center gap-8">
                   <div className="flex -space-x-3">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="h-14 w-14 rounded-full border-4 border-gray-950 bg-gray-800 overflow-hidden shadow-2xl">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="User" />
                        </div>
                      ))}
                      <div className="h-14 w-14 rounded-full border-4 border-gray-950 bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-2xl">
                         +8k
                      </div>
                   </div>
                   <div>
                      <div className="text-sm font-black">Join 10,000+ professionals</div>
                      <div className="text-xs text-gray-500 font-medium">Verified experts and recruiters globally.</div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <FooterStat label="Active Jobs" value="1,284" />
                <FooterStat label="Total Hires" value="4,820" />
                <FooterStat label="Trust Score" value="98.2%" />
                <FooterStat label="Avg Match" value="14min" />
             </div>
          </div>

          <div className="mt-24 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs">SH</div>
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest">SabaHub Ecosystem &copy; 2026</div>
             </div>
             
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Network Optimal</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Security Layer v8.4.2</div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FooterStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] hover:bg-white/10 transition-colors">
       <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</div>
       <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
    </div>
  );
}
