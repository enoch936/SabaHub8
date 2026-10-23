"use client";

import { SocialSidebar } from "@/components/social/standalone/SocialSidebar";
import { SocialHeader } from "@/components/social/standalone/SocialHeader";
import { SocialRightPanel } from "@/components/social/standalone/SocialRightPanel";
import { useTheme } from "@mui/material/styles";

export default function SocialStandaloneLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Enforce pure white/black based on theme
  const bgColor = isDark ? "#000000" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";

  return (
    <div 
      className="h-screen w-screen flex overflow-hidden font-sans selection:bg-primary selection:text-white" 
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <SocialSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 bg-inherit relative h-full overflow-hidden">
        <SocialHeader />
        
        <main className="flex-1 flex min-h-0 bg-inherit overflow-hidden">
           {/* Center Content - Scrollable */}
           <div className="flex-1 overflow-y-auto bg-inherit custom-scrollbar-none">
              {children}
           </div>

           {/* Right Rail - Fixed/Sticky via its own container */}
           <SocialRightPanel />
        </main>
      </div>

      <style jsx global>{`
        :root {
          --social-bg: ${bgColor};
          --social-text: ${textColor};
          --social-border: ${borderColor};
        }

        body {
          background-color: ${bgColor} !important;
          color: ${textColor} !important;
          overflow: hidden !important;
          height: 100vh !important;
          width: 100vw !important;
        }
        
        .custom-scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        
        .custom-scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Override MUI and other component colors to respect the standalone theme */
        .MuiPaper-root, .MuiCard-root {
          background-color: ${bgColor} !important;
          border-color: ${borderColor} !important;
          background-image: none !important;
          box-shadow: none !important;
        }

        /* Enforce pure theme on all nested elements */
        .bg-surface, .bg-card, .bg-muted {
          background-color: ${bgColor} !important;
        }

        .border-border, .border-input {
          border-color: ${borderColor} !important;
        }
      `}</style>
    </div>
  );
}
