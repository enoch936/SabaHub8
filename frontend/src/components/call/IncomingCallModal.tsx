"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";
import useCallStore from "@/lib/callStore";

export function IncomingCallModal() {
  const { status, participantName, callType, acceptCall, rejectCall } =
    useCallStore();

  // Auto-reject after 30 seconds if not answered
  useEffect(() => {
    if (status !== "ringing") return;

    const timeout = setTimeout(() => {
      rejectCall();
    }, 30000);

    return () => clearTimeout(timeout);
  }, [status, rejectCall]);

  if (status !== "ringing") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-2xl p-8 shadow-2xl shadow-black/50 max-w-sm mx-4"
        >
          {/* Animated background */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0"
            />
          </div>

          <div className="relative space-y-6">
            {/* Icon with pulse animation */}
            <div className="flex justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-2xl opacity-50" />
                <div className="relative h-28 w-28 rounded-full border-2 border-white/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md flex items-center justify-center">
                  {callType === "video" ? (
                    <Video className="h-12 w-12 text-white" />
                  ) : (
                    <Mic className="h-12 w-12 text-white" />
                  )}
                </div>
              </motion.div>
            </div>

            {/* Caller info */}
            <div className="text-center space-y-2">
              <p className="text-sm text-white/60">Incoming call</p>
              <h3 className="text-2xl font-bold text-white">{participantName}</h3>
              <p className="text-sm text-white/40">
                {callType === "video" ? "Video call" : "Audio call"}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              {/* Reject button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={rejectCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/40"
                title="Decline call"
              >
                <PhoneOff className="h-7 w-7 text-white" />
              </motion.button>

              {/* Accept button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={acceptCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/40"
                title="Accept call"
              >
                <Phone className="h-7 w-7 text-white" />
              </motion.button>
            </div>

            {/* Auto-reject timer */}
            <p className="text-center text-xs text-white/40">
              Incoming call will be declined in 30 seconds
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
