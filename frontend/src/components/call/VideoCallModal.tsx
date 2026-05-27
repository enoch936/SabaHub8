"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  MoreVertical,
} from "lucide-react";
import useCallStore from "@/lib/callStore";

export function VideoCallModal() {
  const {
    status,
    participantName,
    callType,
    localStream,
    remoteStream,
    isMuted,
    isVideoOn,
    duration,
    toggleMute,
    toggleVideo,
    endCall,
    setRemoteStream,
    setDuration,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Set up local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
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

  if (status === "idle" || status === "ended") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative h-full w-full flex flex-col items-center justify-center gap-4 md:rounded-3xl overflow-hidden max-h-screen"
        >
          {/* Remote video (main/fullscreen) */}
          {remoteStream && status === "active" ? (
            <div className="relative h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Local video (PiP) */}
              <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 h-24 w-32 sm:h-28 sm:w-40 md:h-32 md:w-48 rounded-2xl border-2 border-white/30 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Call info overlay */}
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-3 w-3 rounded-full bg-green-500"
                />
                <div>
                  <p className="text-lg font-semibold text-white">
                    {participantName}
                  </p>
                  <p className="text-sm text-white/60">{formatDuration(callDuration)}</p>
                </div>
              </div>
            </div>
          ) : (
            // Ringing/waiting state
            <div className="flex flex-col items-center justify-center space-y-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-2xl opacity-50" />
                <div className="relative h-24 w-24 rounded-full border-2 border-white/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md flex items-center justify-center">
                  <Video className="h-10 w-10 text-white" />
                </div>
              </motion.div>

              <div className="text-center">
                <p className="text-xl font-semibold text-white">
                  {status === "ringing" ? "Calling" : "Connecting"} {participantName}
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {status === "ringing" ? "Waiting for response..." : "Setting up connection..."}
                </p>
              </div>
            </div>
          )}

          {/* Control buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 px-2"
          >
            {/* Mute button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all ${
                isMuted
                  ? "bg-red-500/20 border border-red-500/50 hover:bg-red-500/30"
                  : "bg-white/20 border border-white/30 hover:bg-white/30"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
              ) : (
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              )}
            </motion.button>

            {/* Video toggle button */}
            {callType === "video" && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleVideo}
                className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all ${
                  !isVideoOn
                    ? "bg-red-500/20 border border-red-500/50 hover:bg-red-500/30"
                    : "bg-white/20 border border-white/30 hover:bg-white/30"
                }`}
                title={isVideoOn ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoOn ? (
                  <Video className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                ) : (
                  <VideoOff className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                )}
              </motion.button>
            )}

            {/* More options button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/20 border border-white/30 hover:bg-white/30 transition-all"
              title="More options"
            >
              <MoreVertical className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </motion.button>

            {/* End call button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={endCall}
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/50"
              title="End call"
            >
              <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
