"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import PageTransition from "@/components/animations/PageTransition";
import MuiAppProvider from "@/components/mui/MuiAppProvider";
import { FloatingChatPanel } from "@/components/chat/FloatingChatPanel";
import { CallProvider } from "@/components/call/CallProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // React Query deduplicates concurrent requests for the same query key automatically
            staleTime: 60000,
            gcTime: 300000,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <MuiAppProvider>
          <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 320, damping: 32 }}>
            <CallProvider>
              <PageTransition>{children}</PageTransition>
              <FloatingChatPanel isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
            </CallProvider>
          </MotionConfig>
          <Toaster position="top-right" richColors />
        </MuiAppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
