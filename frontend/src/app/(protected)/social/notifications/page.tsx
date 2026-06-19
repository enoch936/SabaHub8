"use client";

import { useState, useEffect } from "react";
import { Typography, Avatar, Button, LoadingState, EmptyState, cn } from "@/components/ui";
import { useNotifications } from "@/lib/notifications";
import { useRouter } from "next/navigation";
import { Bell, Heart, MessageCircle, UserPlus, Share2, Bookmark, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function SocialNotificationsPage() {
  const router = useRouter();
  const { items, unread, refresh, markRead, markAllRead, connect } = useNotifications();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    connect().finally(() => setLoading(false));
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE": return <Heart size={18} className="text-red-500" />;
      case "COMMENT": return <MessageCircle size={18} className="text-blue-500" />;
      case "FOLLOW": return <UserPlus size={18} className="text-primary" />;
      case "SHARE": return <Share2 size={18} className="text-green-500" />;
      case "SAVE": return <Bookmark size={18} className="text-yellow-500" />;
      default: return <Bell size={18} className="text-slate-400" />;
    }
  };

  const getMessage = (item: any) => {
    const type = item.type;
    switch (type) {
      case "LIKE": return "liked your post";
      case "COMMENT": return "commented on your post";
      case "FOLLOW": return "started following you";
      case "SHARE": return "shared your post";
      case "SAVE": return "saved your post";
      default: return "interacted with your content";
    }
  };

  if (loading) return <LoadingState label="Loading notifications" />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-primary" />
          <Typography variant="h4" fontWeight={900} className="uppercase tracking-tight">
            Notifications
          </Typography>
          {unread > 0 && (
            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <Button
            variant="text"
            size="sm"
            className="text-primary text-[13px] font-bold"
            onClick={() => markAllRead()}
          >
            <CheckCheck size={16} className="mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="No notifications yet"
          hint="When someone likes, comments, follows, or shares your content, it will appear here."
        />
      ) : (
        <div className="space-y-1">
          {items.map((item: any) => (
            <div
              key={item.id}
              onClick={() => { markRead(item.id); }}
              className={cn(
                "flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer",
                item.read
                  ? "hover:bg-slate-50 dark:hover:bg-white/5"
                  : "bg-primary/5 dark:bg-primary/10 border border-primary/10"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                item.read ? "bg-slate-100 dark:bg-white/5" : "bg-primary/10"
              )}>
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <Typography variant="body2" className="text-[14px] dark:text-slate-200">
                  <span className="font-black">{item.payload?.userName || "Someone"}</span>{" "}
                  {getMessage(item)}
                </Typography>
                <Typography variant="caption" className="text-slate-400 mt-1 block">
                  {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : ""}
                </Typography>
              </div>
              {!item.read && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
