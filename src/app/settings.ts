import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Draft } from "immer";

export type Settings = {
  darkMode?: "dark" | "light";
  language?: string;
  disableMemory?: boolean;
};

type SettingsMapping = {
  [K in keyof Settings]: { key: K; value: Settings[K] };
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState: {} as Settings,
  reducers: {
    initializeSettings(state, action: PayloadAction<Settings>) {
      Object.assign(state, action.payload);
    },
    setSettings<K extends keyof Settings>(
      state: Draft<Settings>,
      action: PayloadAction<SettingsMapping[K]>
    ) {
      const { key, value } = action.payload;
      state[key] = value;
    },
  },
});

export const { initializeSettings, setSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
