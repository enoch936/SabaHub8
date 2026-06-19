"use client";

import { useState, useEffect } from "react";
import { Typography, Avatar, LoadingState, ErrorState, EmptyState, cn } from "@/components/ui";
import { getActivity } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Activity, Heart, MessageCircle, UserPlus, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function SocialActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const data = await getActivity();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart size={18} className="text-red-500" />;
      case "comment": return <MessageCircle size={18} className="text-blue-500" />;
      case "follow": return <UserPlus size={18} className="text-primary" />;
      case "share": return <Share2 size={18} className="text-green-500" />;
      default: return <Activity size={18} className="text-slate-400" />;
    }
  };

  const getMessage = (act: any) => {
    switch (act.type) {
      case "like": return "liked your post";
      case "comment": return `commented: "${act.commentContent}"`;
      case "follow": return "started following you";
      case "share": return "shared your post";
      default: return "interacted with your content";
    }
  };

  if (loading) return <LoadingState label="Loading activity" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Activity size={24} className="text-primary" />
        <Typography variant="h4" fontWeight={900} className="uppercase tracking-tight">
          Activity
        </Typography>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-10 w-10" />}
          title="No activity yet"
          hint="Your social activity — likes, comments, follows, and shares — will appear here."
        />
      ) : (
        <div className="space-y-1">
          {activities.map((act: any, i: number) => (
            <div
              key={`${act.type}-${act.timestamp}-${i}`}
              onClick={() => act.userId && router.push(`/social/profile/${act.userId}`)}
              className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                {getIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={act.userProfilePicture}
                    alt={act.userName}
                    size="sm"
                    className="shrink-0"
                  />
                  <div>
                    <Typography variant="body2" className="text-[14px] dark:text-slate-200">
                      <span className="font-black">{act.userName || "Someone"}</span>{" "}
                      {getMessage(act)}
                    </Typography>
                    <Typography variant="caption" className="text-slate-400 mt-0.5 block">
                      {act.timestamp ? formatDistanceToNow(new Date(act.timestamp), { addSuffix: true }) : ""}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
