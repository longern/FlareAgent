import { createSlice } from "@reduxjs/toolkit";
import type { Middleware, PayloadAction } from "@reduxjs/toolkit";
import type { Draft } from "immer";

import type { AppState } from "./store";

export const SETTINGS_LOCAL_STORAGE_KEY = "flareAgentSettings";

export type Settings = {
  darkMode?: "dark" | "light";
  language?: string;
  systemPrompt?: string;
  disableMemory?: boolean;
  temperature?: number;
};

type SettingsMapping = {
  [K in keyof Settings]: { key: K; value: Settings[K] };
};

function parseLocalStorage<T>(key: string): T | undefined {
  try {
    const value = window.localStorage.getItem(key);
    if (value === null) return undefined;
    return JSON.parse(value);
  } catch (e) {
    return undefined;
  }
}

export const settingsSlice = createSlice({
  name: "settings",
  initialState: (parseLocalStorage(SETTINGS_LOCAL_STORAGE_KEY) ??
    {}) as Settings,
  reducers: {
    setSettings<K extends keyof Settings>(
      state: Draft<Settings>,
      action: PayloadAction<SettingsMapping[K]>
    ) {
      const { key, value } = action.payload;
      if (value === undefined) delete state[key];
      else state[key] = value;
    },
  },
});

type ValueOf<T> = T[keyof T];
type SettingsActions = ReturnType<ValueOf<typeof settingsSlice.actions>>;

export const settingsMiddleware: Middleware<{}, AppState> =
  (store) => (next) => (action: SettingsActions) => {
    next(action);
    if (!action.type.startsWith("settings/")) return;

    switch (action.type) {
      case settingsSlice.actions.setSettings.type: {
        const { settings } = store.getState();
        if (Object.keys(settings).length === 0)
          window.localStorage.removeItem(SETTINGS_LOCAL_STORAGE_KEY);
        else
          window.localStorage.setItem(
            SETTINGS_LOCAL_STORAGE_KEY,
            JSON.stringify(settings)
          );
        break;
      }
    }
  };

export const { setSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
