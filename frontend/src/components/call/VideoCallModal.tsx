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
    isInitiator,
    localStream,
    remoteStream,
    isMuted,
    isVideoOn,
    remoteIsMuted,
    remoteIsVideoOn,
    duration,
    toggleMute,
    toggleVideo,
    endCall,
    setRemoteStream,
    tickDuration,
    mediaError,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localPreviewRef = useRef<HTMLVideoElement>(null);
  const waitingLocalVideoRef = useRef<HTMLVideoElement>(null);

  // Callback ref for remote video to ensure it binds as soon as it mounts
  const setRemoteVideoRef = (el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el;
    if (el && remoteStream && status === "active") {
      console.log("[WebRTC] Binding remote stream via callback ref", {
        streamId: remoteStream.id,
        tracks: remoteStream.getTracks().length,
        videoTracks: remoteStream.getVideoTracks().length
      });
      if (el.srcObject !== remoteStream) {
        el.srcObject = remoteStream;
      }
      el.play().catch(e => console.warn("[WebRTC] Autoplay blocked in callback ref", e));
    }
  };

  // Callback ref for local videos
  const setLocalVideoRef = (el: HTMLVideoElement | null) => {
    if (el && localStream) {
      if (el.srcObject !== localStream) {
        el.srcObject = localStream;
      }
      el.play().catch(() => {});
    }
  };

  // Unified Local Video Binding (Self Preview)
  useEffect(() => {
    if (!localStream) return;

    const bindLocal = () => {
      const refs = [localVideoRef, localPreviewRef, waitingLocalVideoRef];
      refs.forEach(ref => {
        if (ref.current) {
          if (ref.current.srcObject !== localStream) {
            ref.current.srcObject = localStream;
          }
          ref.current.play().catch(() => {});
        }
      });
    };

    bindLocal();
    const timeoutId = setTimeout(bindLocal, 300);
    return () => clearTimeout(timeoutId);
  }, [localStream, status, remoteStream]);

  // Remote Video Binding fallback (handles stream updates without remount)
  useEffect(() => {
    if (status === "active" && remoteStream && remoteVideoRef.current) {
      const videoElement = remoteVideoRef.current;
      if (videoElement.srcObject !== remoteStream) {
        console.log("[WebRTC] Binding remote stream via effect fallback");
        videoElement.srcObject = remoteStream;
      }
      videoElement.play().catch(() => {});
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
          {/* Main Stage */}
          <div className="relative h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 md:rounded-3xl overflow-hidden">
            
            {/* Media Error Overlay */}
            <AnimatePresence>
              {mediaError && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center"
                >
                  <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border-2 border-red-500/50">
                    <VideoOff className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Camera Access Failed</h3>
                  <p className="text-slate-400 max-w-md mb-8">{mediaError}</p>
                  <button
                    onClick={endCall}
                    className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors shadow-lg shadow-red-500/20"
                  >
                    Close Call
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {status === "active" ? (
              <>
                {/* Remote video (fullscreen) */}
                <div className="relative h-full w-full bg-slate-950 flex items-center justify-center">
                  {remoteStream && remoteStream.getTracks().length > 0 ? (
                    <video
                      key="remote-video"
                      ref={setRemoteVideoRef}
                      autoPlay
                      playsInline
                      className={`h-full w-full object-contain transition-opacity duration-700 ${remoteIsVideoOn ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-12 w-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      <div className="text-center">
                        <p className="text-white/60 text-sm animate-pulse">Establishing secure video link...</p>
                        <p className="text-white/30 text-[10px] mt-1">Negotiating encryption and media routes</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Remote Status Overlays */}
                  <AnimatePresence>
                    {remoteStream && !remoteIsVideoOn && (
                      <motion.div 
                        key="remote-video-off-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10"
                      >
                        <div className="h-32 w-32 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700">
                          <VideoOff className="h-12 w-12 text-slate-500" />
                        </div>
                        <p className="mt-4 text-slate-400 font-medium">{participantName} has turned off their camera</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {remoteIsMuted && (
                    <div key="remote-mute-overlay" className="absolute top-20 right-6 bg-red-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/30 flex items-center gap-2 z-40">
                      <MicOff className="h-4 w-4 text-red-400" />
                      <span className="text-xs font-medium text-red-400">Remote Muted</span>
                    </div>
                  )}
                </div>

                {/* Local video (PiP) */}
                <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 h-28 w-40 sm:h-32 sm:w-48 md:h-40 md:w-56 rounded-2xl border-2 border-white/20 bg-slate-950 overflow-hidden shadow-2xl z-30 group">
                  <video
                    key="local-video-pip"
                    ref={setLocalVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`h-full w-full object-cover scale-x-[-1] transition-opacity duration-300 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
                  />
                  
                  <div className={`absolute inset-0 flex flex-col items-center justify-center bg-slate-800 transition-opacity duration-300 ${!isVideoOn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <VideoOff className="h-6 w-6 text-slate-500" />
                    <span className="text-[10px] text-slate-400 mt-1">Camera Off</span>
                  </div>

                  {isMuted && (
                    <div className="absolute top-2 left-2 bg-red-500/80 rounded-full p-1 shadow-lg">
                      <MicOff className="h-3 w-3 text-white" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-white/80 font-medium">You</span>
                  </div>
                </div>
              </>
            ) : (
              /* Waiting / Ringing State with Local Preview */
              <div className="relative h-full w-full flex flex-col items-center justify-center bg-slate-950">
                {localStream && (
                  <video
                    key="waiting-preview-bg"
                    ref={setLocalVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover opacity-40 scale-x-[-1] blur-md"
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-2xl opacity-50" />
                    <div className="relative h-24 w-24 rounded-full border-2 border-white/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md flex items-center justify-center">
                      {status === "active" ? (
                        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Video className="h-10 w-10 text-white" />
                      )}
                    </div>
                  </motion.div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                        isInitiator 
                          ? "bg-blue-500/20 border-blue-500/30 text-blue-400" 
                          : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                      }`}>
                        {isInitiator ? "Outgoing call" : "Incoming call"}
                      </span>
                    </div>
                    <p className="text-xl font-semibold text-white">
                      {status === "ringing" ? (isInitiator ? "Calling" : "Ringing") : "Establishing Connection"} {participantName}
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      {status === "active" ? "Waiting for video stream..." : "Waiting for response..."}
                    </p>
                  </div>
                </div>

                {/* Self Preview PiP while waiting */}
                {localStream && (
                  <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 h-24 w-32 sm:h-28 sm:w-40 md:h-32 md:w-48 rounded-2xl border-2 border-white/30 overflow-hidden shadow-2xl z-20">
                    <video
                      key="waiting-preview-pip"
                      ref={setLocalVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover scale-x-[-1]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Call info overlay (Top Left) */}
            <div className="absolute top-6 left-6 flex items-center gap-3 z-40 bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`h-3 w-3 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">
                    {participantName}
                  </p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                    isInitiator 
                      ? "bg-blue-500/20 border-blue-500/30 text-blue-400" 
                      : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                  }`}>
                    {isInitiator ? "Outgoing" : "Incoming"}
                  </span>
                </div>
                <p className="text-[10px] text-white/60 font-mono">{formatDuration(duration)}</p>
              </div>
            </div>
          </div>

          {/* Control buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 px-2 py-4 z-50"
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
