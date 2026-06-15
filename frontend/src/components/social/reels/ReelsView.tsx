"use client";

import { ReelsContainer } from "./viewer/ReelsContainer";

interface ReelsViewProps {
  userId?: string;
}

export function ReelsView({ userId }: ReelsViewProps) {
  return <ReelsContainer userId={userId} />;
}
