import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const conversationSlice = createSlice({
  name: "error",
  initialState: {
    message: null as string | null,
  },
  reducers: {
    showError(state, action: PayloadAction<{ message: string }>) {
      state.message = action.payload.message;
    },
    hideError(state) {
      state.message = null;
    },
  },
});

export const { showError, hideError } = conversationSlice.actions;

export default conversationSlice.reducer;
