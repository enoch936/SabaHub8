import { useEffect } from "react";
import { me } from "../api/auth";
import { useSessionStore } from "../store/session-store";

export function useSessionBootstrap() {
  const initialized = useSessionStore((state) => state.initialized);
  const token = useSessionStore((state) => state.token);
  const bootstrapToken = useSessionStore((state) => state.bootstrapToken);
  const setUser = useSessionStore((state) => state.setUser);
  const clear = useSessionStore((state) => state.clear);

  useEffect(() => {
    bootstrapToken();
  }, [bootstrapToken]);

  useEffect(() => {
    if (!initialized || !token) {
      return;
    }
    let mounted = true;
    me()
      .then((user) => {
        if (!mounted) {
          return;
        }
        setUser(user);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        clear();
      });
    return () => {
      mounted = false;
    };
  }, [initialized, token, setUser, clear]);
}
