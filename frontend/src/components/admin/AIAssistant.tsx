/**
 * AI Assistant Panel
 * Smart admin assistant for analytics and command execution
 */

"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import {
  Box,
  Stack,
  TextField,
  IconButton,
  Typography,
  useTheme,
  alpha,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GlassCardHeader } from "./GlassCard";

export interface AIMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  loading?: boolean;
}

interface AIPanelProps {
  onSendMessage?: (message: string) => void;
  messages?: AIMessage[];
  loading?: boolean;
  suggestedQueries?: string[];
}

const defaultSuggestedQueries = [
  "What are today's key metrics?",
  "Show me revenue trends",
  "Analyze user growth",
  "What requires attention?",
  "Generate system report",
  "Find anomalies in data",
];

export function AIAssistantPanel({
  onSendMessage,
  messages = [],
  loading = false,
  suggestedQueries = defaultSuggestedQueries,
}: AIPanelProps) {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<AIMessage[]>(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    onSendMessage?.(input);
    setInput("");
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
  };

  return (
    <GlassCard>
      <GlassCardHeader
        title="AI Assistant"
        subtitle="Intelligent analytics and insights"
      />

      {/* Messages Area */}
      <Box
        sx={{
          height: 320,
          display: "flex",
          flexDirection: "column",
          mb: 2,
          p: 2,
          borderRadius: "12px",
          backgroundColor: alpha(theme.palette.background.default, 0.3),
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          overflowY: "auto",
        }}
      >
        {localMessages.length === 0 && !input ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              opacity: 0.6,
              textAlign: "center",
            }}
          >
            <Stack spacing={2} alignItems="center">
              <SmartToyRoundedIcon
                sx={{ fontSize: 48, color: theme.palette.text.secondary }}
              />
              <Typography variant="body2" color="text.secondary">
                Ask me anything about your platform
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Stack spacing={2}>
            <AnimatePresence>
              {localMessages.map((message, idx) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        message.type === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "80%",
                        px: 2,
                        py: 1,
                        borderRadius: "12px",
                        backgroundColor:
                          message.type === "user"
                            ? alpha(theme.palette.primary.main, 0.2)
                            : alpha(theme.palette.background.paper, 0.5),
                        border:
                          message.type === "user"
                            ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                            : `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: theme.palette.text.primary,
                          wordBreak: "break-word",
                        }}
                      >
                        {message.content}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "10px",
                          color: theme.palette.text.secondary,
                          mt: 0.5,
                          textAlign:
                            message.type === "user" ? "right" : "left",
                        }}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  {message.suggestions && message.suggestions.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1, ml: 2 }}>
                      {message.suggestions.map((suggestion) => (
                        <Chip
                          key={suggestion}
                          size="small"
                          label={suggestion}
                          variant="outlined"
                          onClick={() => handleSuggestedQuery(suggestion)}
                          sx={{
                            fontSize: "11px",
                            height: 24,
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.1
                              ),
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  AI is thinking...
                </Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Stack>
        )}
      </Box>

      {/* Suggested Queries */}
      {localMessages.length === 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{ fontSize: "11px", fontWeight: 600, mb: 1, opacity: 0.7 }}
          >
            Suggested Queries
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {suggestedQueries.slice(0, 3).map((query) => (
              <Chip
                key={query}
                size="small"
                label={query}
                onClick={() => handleSuggestedQuery(query)}
                sx={{
                  fontSize: "11px",
                  height: 26,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Input Area */}
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField
          fullWidth
          multiline
          maxRows={3}
          minRows={1}
          placeholder="Ask about metrics, reports, or platform status..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={loading}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
              borderRadius: "12px",
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              "&:hover": {
                borderColor: alpha(theme.palette.primary.main, 0.5),
              },
              "&.Mui-focused": {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
        />
        <Tooltip title="Send message">
          <IconButton
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            size="small"
            sx={{
              color: theme.palette.primary.main,
            }}
          >
            <SendRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </GlassCard>
  );
}
