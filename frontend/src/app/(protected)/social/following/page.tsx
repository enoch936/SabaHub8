"use client";

import { useState, useEffect } from "react";
import { Typography, Avatar, Button, LoadingState, ErrorState, cn } from "@/components/ui";
import { getFollowing, unfollowUser, followUser } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SocialFollowingPage() {
  const router = useRouter();
  const currentUser = useSession((s) => s.user);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      fetchFollowing();
    }
  }, [currentUser?.id]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const data = await getFollowing(currentUser!.id!);
      setFollowing(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(userId);
      setFollowing((prev) => prev.filter((u: any) => u.id !== userId));
      toast.success("Unfollowed");
    } catch (err: any) {
      toast.error(err.message || "Failed to unfollow");
    }
  };

  if (loading) return <LoadingState label="Loading following" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Typography variant="h4" fontWeight={900} className="uppercase tracking-tight mb-8">
        Following
      </Typography>

      {following.length === 0 ? (
        <div className="text-center py-16">
          <Typography variant="body1" className="text-slate-500 font-medium">
            Not following anyone yet
          </Typography>
          <Typography variant="body2" className="text-slate-400 mt-2">
            Explore trending creators and follow them!
          </Typography>
        </div>
      ) : (
        <div className="space-y-2">
          {following.map((user: any) => (
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
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl shrink-0 border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-500/10"
                onClick={(e) => { e.stopPropagation(); handleUnfollow(user.id); }}
              >
                Unfollow
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
