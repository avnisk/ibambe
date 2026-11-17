"use client";

import { useState, useEffect, useCallback } from "react";
import { DigitalTwinState } from "@/types";
import { BACKEND_BASE_URL, DEFAULT_MOCK_STATE } from "./api";

/**
 * React hook for real-time live data polling with fallback support.
 * Designed to wire directly into data-display components without altering their layout or styling.
 */
export function useLiveTwinState(
  pollIntervalMs: number = 2000,
  initialData?: DigitalTwinState
) {
  const [state, setState] = useState<DigitalTwinState>(
    initialData || DEFAULT_MOCK_STATE
  );
  const [isLive, setIsLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);

      const res = await fetch(`${BACKEND_BASE_URL}/state`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (res.ok) {
        const liveData: DigitalTwinState = await res.json();
        setState(liveData);
        setIsLive(true);
        setError(null);
      } else {
        setIsLive(false);
      }
    } catch {
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const timer = setInterval(fetchState, pollIntervalMs);
    return () => clearInterval(timer);
  }, [fetchState, pollIntervalMs]);

  return { state, isLive, error, refresh: fetchState };
}
