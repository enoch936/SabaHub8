"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import PageTransition from "@/components/animations/PageTransition";
import MuiAppProvider from "@/components/mui/MuiAppProvider";

export default function Providers({ children }: { children: ReactNode }) {
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
            <PageTransition>{children}</PageTransition>
          </MotionConfig>
          <Toaster position="top-right" richColors />
        </MuiAppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
