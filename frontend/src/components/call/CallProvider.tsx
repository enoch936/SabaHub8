"use client";

import { ReactNode } from "react";
import { VideoCallModal } from "@/components/call/VideoCallModal";
import { AudioCallOverlay } from "@/components/call/AudioCallOverlay";
import { IncomingCallModal } from "@/components/call/IncomingCallModal";
import { CallSignaling } from "@/components/call/CallSignaling";

interface CallProviderProps {
  children: ReactNode;
}

/**
 * CallProvider - Wraps the app to provide calling functionality globally
 * Renders call modals that can be triggered from anywhere in the app using useCallStore
 */
export function CallProvider({ children }: CallProviderProps) {
  return (
    <>
      {children}
      <CallSignaling />
      <VideoCallModal />
      <AudioCallOverlay />
      <IncomingCallModal />
    </>
  );
}
