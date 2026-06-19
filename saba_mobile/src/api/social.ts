import { client } from "./client";

export type SocialPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  content: string;
  mediaAssetIds?: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  isLiked?: boolean;
};

export const socialApi = {
  getFeed: (page = 0, size = 20) => 
    client.get(`/social/feed?page=${page}&size=${size}`),
  
  getGlobalFeed: (page = 0, size = 20) => 
    client.get(`/social/feed/global?page=${page}&size=${size}`),
    
  createPost: (data: { content: string; mediaAssetIds?: string[] }) =>
    client.post("/social/posts", data),
    
  likePost: (postId: string) =>
    client.post(`/social/posts/${postId}/like`),
    
  unlikePost: (postId: string) =>
    client.post(`/social/posts/${postId}/unlike`),
    
  addComment: (postId: string, content: string) =>
    client.post(`/social/posts/${postId}/comments`, { content }),
    
  follow: (userId: string) =>
    client.post("/social/follow", { userId }),
    
  unfollow: (userId: string) =>
    client.post("/social/unfollow", { userId }),
};
