"use client";

import DashboardWorkspace from "@/components/workspace/dashboard/DashboardWorkspace";
import AIAssistantOverlay from "@/components/dashboard/AIAssistantOverlay";

export default function DashboardPage() {
  return (
    <>
      <DashboardWorkspace />
      <AIAssistantOverlay />
    </>
  );
}
