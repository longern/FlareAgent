import { createSlice } from "@reduxjs/toolkit";

export const dialogsSlice = createSlice({
  name: "dialogs",
  initialState: {
    files: false,
    settings: false,
  },
  reducers: {
    showFiles: (state) => {
      state.files = true;
    },
    showSettings: (state) => {
      state.settings = true;
    },
    hideFiles: (state) => {
      state.files = false;
    },
    hideSettings: (state) => {
      state.settings = false;
    },
  },
});

export const { showFiles, hideFiles, showSettings, hideSettings } =
  dialogsSlice.actions;

export default dialogsSlice.reducer;
