import { useMemo, useRef } from "react";
import { stompService } from "../services/websocket/stomp-client";

export function useTyping(threadId: string) {
  const lastTypedAtRef = useRef(0);
  const lastSentStateRef = useRef<boolean>(false);

  return useMemo(
    () => ({
      sendTyping: (typing: boolean) => {
        const now = Date.now();
        const elapsed = now - lastTypedAtRef.current;
        if (typing === lastSentStateRef.current && elapsed < 1200) {
          return;
        }
        lastTypedAtRef.current = now;
        lastSentStateRef.current = typing;
        stompService.publish(`/app/threads/${threadId}/typing`, { typing });
      },
    }),
    [threadId],
  );
}
