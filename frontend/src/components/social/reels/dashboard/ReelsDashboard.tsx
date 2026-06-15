"use client";

import { useState, useEffect } from "react";
import { 
  Typography, 
  Card, 
  Button, 
  Tabs, 
  Avatar,
  Table,
  Badge,
  Skeleton,
  cn
} from "@/components/ui";
import { 
  BarChart3, 
  Play, 
  Clock, 
  FileEdit, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Eye,
  TrendingUp,
  Users
} from "lucide-react";

export function ReelsDashboard() {
  const [activeTab, setActiveTab] = useState("published");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        totalViews: "1.2M",
        avgEngagement: "8.4%",
        followersGained: "+2,400",
        topReel: "Morning Design Routine"
      });
      setLoading(false);
    }, 1500);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <Typography variant="h4" fontWeight={900} className="tracking-tight mb-1">Creator Dashboard</Typography>
           <Typography variant="body2" color="text.secondary">Monitor your reel performance and manage your professional content.</Typography>
        </div>
        <Button className="rounded-xl px-6 py-6 shadow-xl shadow-primary/20">
          Analytics Report
        </Button>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Eye className="text-blue-500" />} label="Total Views" value={stats?.totalViews} loading={loading} />
        <StatCard icon={<TrendingUp className="text-emerald-500" />} label="Engagement" value={stats?.avgEngagement} loading={loading} />
        <StatCard icon={<Users className="text-primary" />} label="New Followers" value={stats?.followersGained} loading={loading} />
        <StatCard icon={<ThumbsUp className="text-orange-500" />} label="Likes Received" value="450K" loading={loading} />
      </div>

      <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6">
          <Tabs 
            tabs={[
              { key: "published", label: "Published" },
              { key: "drafts", label: "Drafts" },
              { key: "scheduled", label: "Scheduled" },
              { key: "saved", label: "Saved" }
            ]} 
            value={activeTab} 
            onChange={setActiveTab} 
          />
        </div>

        <div className="p-6">
           <Table 
             columns={[
               { 
                 key: "content", 
                 header: "Content",
                 render: (row) => (
                   <div className="flex items-center gap-4">
                     <div className="h-16 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                       <img src={row.thumb} className="h-full w-full object-cover" />
                     </div>
                     <div>
                       <Typography variant="subtitle2" fontWeight={700}>{row.title}</Typography>
                       <Typography variant="caption" color="text.secondary">{row.date}</Typography>
                     </div>
                   </div>
                 )
               },
               { 
                 key: "views", 
                 header: "Views",
                 render: (row) => (
                   <div className="flex items-center gap-2 font-bold">
                     <Eye size={14} className="text-slate-400" />
                     {row.views}
                   </div>
                 )
               },
               { 
                 key: "engagement", 
                 header: "Engagement",
                 render: (row) => (
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 text-xs">
                         <span className="flex items-center gap-1"><ThumbsUp size={10} /> {row.likes}</span>
                         <span className="flex items-center gap-1"><MessageSquare size={10} /> {row.comments}</span>
                      </div>
                      <Progress value={row.rate} className="h-1 w-20" />
                   </div>
                 )
               },
               { 
                 key: "status", 
                 header: "Status",
                 render: (row) => <Badge variant="success">Active</Badge>
               },
               { 
                 key: "actions", 
                 header: "",
                 render: (row) => (
                   <Button variant="text" size="sm">Edit</Button>
                 )
               }
             ]}
             rows={MOCK_DATA}
           />
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, loading }: any) {
  return (
    <Card className="p-6 rounded-3xl border-none shadow-sm flex flex-col gap-4">
      <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
        {icon}
      </div>
      <div>
        <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-wider">{label}</Typography>
        {loading ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <Typography variant="h4" fontWeight={900} className="tracking-tight">{value}</Typography>
        )}
      </div>
    </Card>
  );
}

function Progress({ value, className }: any) {
  return (
    <div className={cn("w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden", className)}>
      <div className="h-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  );
}

const MOCK_DATA = [
  {
    id: "1",
    title: "Building the future with SabaHub",
    date: "Jun 12, 2026",
    views: "250K",
    likes: "12K",
    comments: "450",
    rate: 85,
    thumb: "https://picsum.photos/seed/reel1/100/150"
  },
  {
    id: "2",
    title: "Morning Routine for Designers",
    date: "Jun 10, 2026",
    views: "120K",
    likes: "8.4K",
    comments: "230",
    rate: 65,
    thumb: "https://picsum.photos/seed/reel2/100/150"
  }
];
