import { createContext, useContext } from "react";
import type { AppState } from "../types/types";

export type StoreValue = {
  state: AppState;
  // Applies a change from actions.ts; rethrows its error for the caller to show
  run: (change: (state: AppState) => AppState) => void;
  reset: () => void;
  storageFull: boolean;
};

export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

export function useSession() {
  const { state } = useStore();
  const user = state.users.find((u) => u.id === state.currentUserId) ?? null;
  const household = state.households.find((h) => h.id === user?.householdId) ?? null;
  const area = state.areas.find((a) => a.id === user?.postcodeAreaId) ?? null;
  return { user, household, area };
}

// Session for pages behind the onboarding guard, where all three always exist
export function useMember() {
  const { user, household, area } = useSession();
  if (!user || !household || !area) throw new Error("useMember needs a signed-in household member");
  return { user, household, area };
}
