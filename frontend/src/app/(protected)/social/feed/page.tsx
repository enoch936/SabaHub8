"use client";

import { useState } from "react";
import { Stories } from "@/components/social/standalone/Stories";
import { CreatePost } from "@/components/social/CreatePost";
import { Feed } from "@/components/social/Feed";
import { createSocialPost } from "@/lib/api";
import { toast } from "sonner";

export default function SocialFeedPage() {
  const [feedKey, setFeedKey] = useState(0);

  const handlePost = async (content: string, mediaAssetIds?: string[], type?: "FEED" | "STORY") => {
    try {
      await createSocialPost({ content, mediaAssetIds, type });
      toast.success(type === "STORY" ? "Story shared!" : "Moment shared with professionals!");
      // Dispatch global event for refresh
      window.dispatchEvent(new CustomEvent("social-post-created"));
      setFeedKey((prev) => prev + 1); // Local refresh
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col gap-10">
      {/* Stories Section */}
      <Stories />

      {/* Create Post Area */}
      <div className="bg-inherit border-none shadow-none">
        <CreatePost onPost={handlePost} initialType="FEED" />
      </div>

      {/* Main Social Feed */}
      <div className="space-y-6">
        <Feed key={feedKey} />
      </div>
    </div>
  );
}
