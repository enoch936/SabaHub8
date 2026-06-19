"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MoreVertical,
  Volume2,
  VolumeX,
} from "lucide-react";
import useCallStore from "@/lib/callStore";

export function AudioCallOverlay() {
  const {
    status,
    participantName,
    callType,
    isInitiator,
    localStream,
    remoteStream,
    isMuted,
    duration,
    toggleMute,
    endCall,
    tickDuration,
  } = useCallStore();

  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Set up remote audio stream
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, status]);

  // Call duration timer
  useEffect(() => {
    if (status !== "active") return;

    const interval = setInterval(() => {
      tickDuration();
    }, 1000);

    return () => clearInterval(interval);
  }, [status, tickDuration]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (callType !== "audio" || status === "idle" || status === "ended") {
    return null;
  }

  return (
    <>
      {/* Audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay={true} />

      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-2xl p-6 shadow-2xl shadow-black/50 min-w-[320px]">
            {/* Animated background gradient */}
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

            <div className="relative space-y-4">
              {/* Status indicator */}
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-green-500"
                />
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white/60">
                    {status === "ringing" ? (isInitiator ? "Calling" : "Ringing") : "In call"}
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                    isInitiator 
                      ? "bg-blue-500/20 border-blue-500/30 text-blue-400" 
                      : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                  }`}>
                    {isInitiator ? "Outgoing" : "Incoming"}
                  </span>
                </div>
              </div>

              {/* Participant name */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">
                  {participantName}
                </h3>
                <p className="mt-1 text-sm font-mono text-white/40">
                  {formatDuration(duration)}
                </p>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className={`h-12 w-12 flex items-center justify-center rounded-2xl border transition-all ${
                    isMuted
                      ? "bg-red-500/20 border-red-500/30 text-red-400"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`h-12 w-12 flex items-center justify-center rounded-2xl border transition-all ${
                    !isSpeakerOn
                      ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                  title={isSpeakerOn ? "Speaker on" : "Speaker off"}
                >
                  {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={endCall}
                  className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-500 to-red-600 border border-red-500/50 shadow-lg shadow-red-500/20"
                  title="End call"
                >
                  <PhoneOff className="h-5 w-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
