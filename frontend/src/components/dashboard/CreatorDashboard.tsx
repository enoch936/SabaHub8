"use client";

import { useEffect, useState } from "react";
import { 
  getFreelancerWorkspaceAnalytics,
  type FreelancerWorkspaceAnalytics
} from "@/lib/api";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Zap, 
  Star, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Trophy,
  Target,
  Rocket
} from "lucide-react";
import { clsx } from "clsx";

export default function CreatorDashboard() {
  const [stats, setStats] = useState<FreelancerWorkspaceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getFreelancerWorkspaceAnalytics();
        setStats(data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="h-96 bg-gray-50 animate-pulse rounded-[48px]" />;
  if (!stats) return null;

  return (
    <div className="space-y-10 pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Live Creator Intelligence</span>
           </div>
           <h1 className="text-4xl font-black text-gray-950 tracking-tighter">Performance Hub</h1>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white border border-gray-100 p-4 rounded-[32px] flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                 <Trophy className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                 <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Rank</div>
                 <div className="text-lg font-black text-gray-950 tracking-tight">Top 2%</div>
              </div>
           </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Earnings" 
          value={`$${stats.totalEarnings.toLocaleString()}`} 
          change="+12.5%" 
          positive={true}
          icon={<Zap className="h-5 w-5" />}
          color="indigo"
        />
        <StatCard 
          label="Project Success" 
          value={`${stats.successRate}%`} 
          change="+2.1%" 
          positive={true}
          icon={<Target className="h-5 w-5" />}
          color="emerald"
        />
        <StatCard 
          label="Client Rating" 
          value={stats.rating.toFixed(1)} 
          change="High" 
          positive={true}
          icon={<Star className="h-5 w-5" />}
          color="amber"
        />
        <StatCard 
          label="Active Reach" 
          value={stats.activeProjects.toString()} 
          change="-5%" 
          positive={false}
          icon={<Users className="h-5 w-5" />}
          color="rose"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Monthly Growth Chart (Simplified) */}
         <div className="lg:col-span-2 bg-gray-950 rounded-[48px] p-10 text-white relative overflow-hidden isolate">
            <div className="absolute top-0 right-0 -z-10 opacity-20">
               <div className="w-96 h-96 bg-indigo-500 blur-[120px] rounded-full" />
            </div>
            
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-black uppercase tracking-tight">Revenue Stream</h3>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-indigo-500" />
                     <span className="text-[10px] font-bold uppercase text-gray-400">Earnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-gray-800" />
                     <span className="text-[10px] font-bold uppercase text-gray-400">Projects</span>
                  </div>
               </div>
            </div>

            <div className="h-64 flex items-end gap-3">
               {stats.monthlyEarnings.map((m, i) => (
                 <div key={m.month} className="flex-1 flex flex-col items-center gap-4 group">
                    <div className="w-full relative">
                       <div 
                         className="w-full bg-indigo-600 rounded-2xl group-hover:bg-indigo-400 transition-all duration-500" 
                         style={{ height: `${(m.amount / 10000) * 100}%`, minHeight: '8px' }}
                       />
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-950 text-[10px] font-black px-2 py-1 rounded-lg">
                          ${m.amount}
                       </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">{m.month}</span>
                 </div>
               ))}
            </div>
         </div>

         {/* AI Recommendations */}
         <div className="bg-indigo-50 rounded-[48px] p-8 border border-indigo-100">
            <div className="flex items-center gap-3 mb-8">
               <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
               </div>
               <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight">AI Insights</h3>
            </div>

            <div className="space-y-4">
               <InsightCard 
                  title="Optimize Hourly Rate" 
                  desc="Your current rate is 15% below market average for your skill set." 
                  icon={<TrendingUp className="h-4 w-4" />}
               />
               <InsightCard 
                  title="Expand to Web3" 
                  desc="High demand detected for 'Solidity' in your primary industry." 
                  icon={<Rocket className="h-4 w-4" />}
               />
               <InsightCard 
                  title="Portfolio Gap" 
                  desc="Adding 2 more case studies could increase your profile views by 40%." 
                  icon={<BarChart3 className="h-4 w-4" />}
               />
            </div>

            <button className="w-full mt-8 py-4 bg-gray-950 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">
               View Full Report
            </button>
         </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, positive, icon, color }: any) {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
      <div className={clsx("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", colors[color])}>
        {icon}
      </div>
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="flex items-end justify-between">
         <div className="text-3xl font-black text-gray-950 tracking-tighter">{value}</div>
         <div className={clsx(
           "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg",
           positive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
         )}>
           {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
           {change}
         </div>
      </div>
    </div>
  );
}

function InsightCard({ title, desc, icon }: any) {
  return (
    <div className="bg-white/60 p-5 rounded-3xl border border-white hover:bg-white transition-all cursor-pointer">
       <div className="flex items-center gap-3 mb-2">
          <div className="text-indigo-600">{icon}</div>
          <div className="text-xs font-black text-gray-950 uppercase tracking-tight">{title}</div>
       </div>
       <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
