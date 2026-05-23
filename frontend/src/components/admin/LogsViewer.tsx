"use client";

import { Box, Typography, alpha, useTheme } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { GlassCard, GlassCardHeader } from "./GlassCard";

interface LogsViewerProps {
  streamUrl: string;
}

export function LogsViewer({ streamUrl }: LogsViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener("logs", (event) => {
      setLogs((prev) => {
        const next = [...prev, event.data];
        if (next.length > 200) return next.slice(next.length - 200);
        return next;
      });
    });

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [streamUrl]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <GlassCard sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
      <GlassCardHeader title="Live System Logs" subtitle="Real-time backend telemetry" />
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          mt: 2,
          p: 2,
          bgcolor: alpha('#000', 0.8),
          borderRadius: '12px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#10B981', // Terminal green
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.divider, 0.2),
            borderRadius: '4px',
          },
        }}
      >
        {logs.map((log, i) => (
          <Typography
            key={i}
            component="div"
            sx={{
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              borderLeft: '2px solid transparent',
              pl: 1,
              '&:hover': {
                bgcolor: alpha('#fff', 0.05),
                borderLeftColor: '#10B981',
              }
            }}
          >
            <span style={{ opacity: 0.5, marginRight: '8px' }}>[{new Date().toLocaleTimeString()}]</span>
            {log}
          </Typography>
        ))}
        {logs.length === 0 && (
          <Typography sx={{ opacity: 0.5, fontStyle: 'italic' }}>Waiting for logs...</Typography>
        )}
      </Box>
    </GlassCard>
  );
}
