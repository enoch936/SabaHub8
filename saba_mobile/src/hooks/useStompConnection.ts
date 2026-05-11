import { useEffect } from "react";
import { stompService } from "../services/websocket/stomp-client";
import { useSessionStore } from "../store/session-store";

export function useStompConnection() {
  const token = useSessionStore((state) => state.token);

  useEffect(() => {
    if (!token) {
      stompService.disconnect();
      return;
    }
    let mounted = true;
    stompService.ensureConnected().catch(() => {
      if (!mounted) {
        return;
      }
    });

    return () => {
      mounted = false;
    };
  }, [token]);
}
