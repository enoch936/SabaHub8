"use client";

import { useEffect } from "react";
import { subscribeCallSignals, connectWs, sendCallSignal } from "@/lib/ws";
import useCallStore from "@/lib/callStore";
import { toast } from "sonner";

/**
 * CallSignaling - Handles incoming call signals via WebSocket
 * This component doesn't render anything, but must be active for calls to work
 */
export function CallSignaling() {
  useEffect(() => {
    // Watch for token changes and connect
    const checkConnection = () => {
      const token = typeof window !== "undefined" ? (localStorage.getItem("auth_token") || localStorage.getItem("token")) : null;
      if (token) {
        console.log("CallSignaling: Found token, ensuring connection...");
        void connectWs();
      }
    };

    checkConnection();
    
    // Also listen for storage events in case of multi-tab login
    if (typeof window !== "undefined") {
      window.addEventListener("storage", checkConnection);
    }

    console.log("CallSignaling: Subscribing to call signals...");
    const subscription = subscribeCallSignals((payload: any) => {
      // Use getState to get current values without re-subscribing the effect
      const { 
        status, 
        callId, 
        isInitiator, 
        handleIncomingCall, 
        handleSignal 
      } = useCallStore.getState();

      console.log(`CallSignaling: Received signal`, payload);
      
      const { type, fromUserId, fromUserName, callType, callId: incomingCallId, signal } = payload;

      switch (type) {
        case "ringing":
          console.log(`CallSignaling: Incoming call ${incomingCallId} from ${fromUserId} (${status})`);
          if (status === "idle") {
            handleIncomingCall(fromUserId, fromUserName || "Incoming Call", callType, incomingCallId);
            toast.info(`Incoming ${callType} call from ${fromUserName || fromUserId}`);
          } else if (status === "ringing" && callId !== incomingCallId) {
            // Busy
            console.log("CallSignaling: Busy, ignoring incoming call");
          }
          break;

        case "signal":
          // Handle signals if we are in ringing or active state for this call
          if (status !== "idle" && callId === incomingCallId) {
            handleSignal(signal);
          } else if (status === "idle") {
            // If we get a signal while idle, it might be an offer that arrived 
            // before or slightly after the ringing signal. 
            // In a more robust system, we would buffer these by incomingCallId.
            console.warn("CallSignaling: Received signal while idle, ignoring. (Possible race condition)");
          }
          break;

        case "mute-status":
          if ((status === "active" || status === "ringing") && callId === incomingCallId) {
            const { isMuted: remoteMuted, isVideoOn: remoteVideoOn } = payload;
            useCallStore.getState().updateRemoteStatus(!!remoteMuted, !!remoteVideoOn);
          }
          break;

        case "accept":
          if (status === "ringing" && callId === incomingCallId && isInitiator) {
            console.log("CallSignaling: Peer accepted the call");
            // Transition to active state (will show "Connecting..." until stream arrives)
            useCallStore.setState({ status: "active" });

            // Re-sync current status so receiver knows our initial hardware state
            const currentState = useCallStore.getState();
            if (currentState.participantId) {
              sendCallSignal({
                targetUserId: currentState.participantId,
                type: "mute-status",
                callId: incomingCallId,
                isMuted: currentState.isMuted,
                isVideoOn: currentState.isVideoOn
              });
            }
          }
          break;

        case "reject":
          if (status !== "idle" && callId === incomingCallId) {
            toast.error("Call rejected");
            useCallStore.getState().reset();
          }
          break;

        case "end":
          if (status !== "idle" && callId === incomingCallId) {
            toast.info("Call ended");
            useCallStore.getState().reset();
          }
          break;
      }
    });

    return () => {
      console.log("CallSignaling: Unsubscribing from call signals");
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", checkConnection);
      }
      subscription?.unsubscribe();
    };
  }, []); // Stable subscription

  return null;
}
