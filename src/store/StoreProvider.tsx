import { useEffect, useRef, useState, type ReactNode } from "react";
import { createSeedState } from "../data/seed";
import { hoursSince } from "../lib/dates";
import { buildProfile, fetchLiveValues, profileValues } from "../lib/profile";
import type { AppState } from "../types/types";
import { reassignStaleProofs, setAreaProfile } from "./actions";
import { StoreContext } from "./context";

const STORAGE_KEY = "postgrow";
const PROFILE_REFRESH_HOURS = 1;

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AppState;
      if (Array.isArray(parsed.activities)) return reassignStaleProofs(parsed);
    }
  } catch {
    // Unreadable storage falls back to the demo data
  }
  return createSeedState();
}

function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState);
  const [storageFull, setStorageFull] = useState(false);
  const latest = useRef(state);
  const refreshing = useRef(new Set<string>());

  const run = (change: (state: AppState) => AppState) => {
    latest.current = change(latest.current);
    setState(latest.current);
    setStorageFull(!saveState(latest.current));
  };

  const reset = () => run(() => createSeedState());

  // Live air and energy readings for any sector whose profile is missing or old
  useEffect(() => {
    for (const area of state.areas) {
      const fresh = area.profile && hoursSince(area.profile.updatedAt, Date.now()) < PROFILE_REFRESH_HOURS;
      if (fresh || refreshing.current.has(area.id)) continue;
      refreshing.current.add(area.id);
      fetchLiveValues(area.center, area.outcode)
        .then((live) => {
          const values = { ...profileValues(area.profile), ...live };
          run((s) => setAreaProfile(s, area.id, buildProfile(values)));
        })
        .finally(() => refreshing.current.delete(area.id));
    }
  }, [state.areas]);

  return <StoreContext.Provider value={{ state, run, reset, storageFull }}>{children}</StoreContext.Provider>;
}
