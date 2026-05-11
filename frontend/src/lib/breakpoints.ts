"use client";

import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
}

const MOBILE_MAX = 600;
const TABLET_MAX = 1200;

function getBreakpoint(width: number): Breakpoint {
  if (width < MOBILE_MAX) return "mobile";
  if (width < TABLET_MAX) return "tablet";
  return "desktop";
}

function getState(bp: Breakpoint): BreakpointState {
  return {
    isMobile: bp === "mobile",
    isTablet: bp === "tablet",
    isDesktop: bp === "desktop",
    breakpoint: bp,
  };
}

// SSR-safe default: assume desktop on server
const SSR_DEFAULT = getState("desktop");

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    if (typeof window === "undefined") return SSR_DEFAULT;
    return getState(getBreakpoint(window.innerWidth));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_MAX - 1}px)`);
    const tabletQuery = window.matchMedia(
      `(min-width: ${MOBILE_MAX}px) and (max-width: ${TABLET_MAX - 1}px)`
    );

    const update = () => {
      setState(getState(getBreakpoint(window.innerWidth)));
    };

    mobileQuery.addEventListener("change", update);
    tabletQuery.addEventListener("change", update);

    // Sync on mount in case SSR default differs
    update();

    return () => {
      mobileQuery.removeEventListener("change", update);
      tabletQuery.removeEventListener("change", update);
    };
  }, []);

  return state;
}
