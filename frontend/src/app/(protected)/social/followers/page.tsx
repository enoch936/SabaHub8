"use client";

import { useState, useEffect } from "react";
import { Typography, Avatar, Button, LoadingState, ErrorState, cn } from "@/components/ui";
import { getFollowers, followUser, unfollowUser } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SocialFollowersPage() {
  const router = useRouter();
  const currentUser = useSession((s) => s.user);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      fetchFollowers();
    }
  }, [currentUser?.id]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const data = await getFollowers(currentUser!.id!);
      setFollowers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (userId: string) => {
    try {
      const isFollowing = followers.find((f: any) => f.id === userId)?.isFollowing;
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      fetchFollowers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update follow status");
    }
  };

  if (loading) return <LoadingState label="Loading followers" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Typography variant="h4" fontWeight={900} className="uppercase tracking-tight mb-8">
        Followers
      </Typography>

      {followers.length === 0 ? (
        <div className="text-center py-16">
          <Typography variant="body1" className="text-slate-500 font-medium">
            No followers yet
          </Typography>
          <Typography variant="body2" className="text-slate-400 mt-2">
            When someone follows you, they will appear here.
          </Typography>
        </div>
      ) : (
        <div className="space-y-2">
          {followers.map((user: any) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
              onClick={() => router.push(`/social/profile/${user.id}`)}
            >
              <Avatar
                src={user.profile?.profilePictureUrl}
                alt={user.fullName}
                size="md"
                className="ring-2 ring-primary/10 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Typography variant="subtitle2" fontWeight={900} className="truncate dark:text-white">
                  {user.fullName}
                </Typography>
                <Typography variant="caption" className="text-slate-400 font-medium">
                  @{user.username || user.email?.split("@")[0]}
                </Typography>
              </div>
              {currentUser?.id !== user.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleToggleFollow(user.id); }}
                >
                  Following
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
