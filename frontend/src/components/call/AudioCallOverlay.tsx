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
    localStream,
    remoteStream,
    isMuted,
    duration,
    toggleMute,
    endCall,
    setDuration,
  } = useCallStore();

  const [callDuration, setCallDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Set up remote audio stream
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (status !== "active") return;

    const interval = setInterval(() => {
      setCallDuration((prev) => {
        const newDuration = prev + 1;
        setDuration(newDuration);
        return newDuration;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, setDuration]);

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
                <p className="text-sm text-white/60">
                  {status === "ringing" ? "Calling" : "In call"}
                </p>
              </div>

              {/* Participant name */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">
                  {participantName}
                </h3>
                <p className="mt-1 text-sm font-mono text-white/40">
                  {formatDuration(callDuration)}
                </p>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-center gap-3">
                {/* Volume toggle */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                    !isSpeakerOn
                      ? "bg-red-500/20 border border-red-500/50 hover:bg-red-500/30"
                      : "bg-white/20 border border-white/30 hover:bg-white/30"
                  }`}
                  title={isSpeakerOn ? "Turn off speaker" : "Turn on speaker"}
                >
                  {isSpeakerOn ? (
                    <Volume2 className="h-5 w-5 text-white" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-red-400" />
                  )}
                </motion.button>

                {/* Mute button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleMute}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                    isMuted
                      ? "bg-red-500/20 border border-red-500/50 hover:bg-red-500/30"
                      : "bg-white/20 border border-white/30 hover:bg-white/30"
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5 text-red-400" />
                  ) : (
                    <Mic className="h-5 w-5 text-white" />
                  )}
                </motion.button>

                {/* More options */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 border border-white/30 hover:bg-white/30 transition-all"
                  title="More options"
                >
                  <MoreVertical className="h-5 w-5 text-white" />
                </motion.button>

                {/* End call button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={endCall}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/40"
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
