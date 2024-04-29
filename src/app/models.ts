import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const modelsSlice = createSlice({
  name: "error",
  initialState: {
    models: null as string[] | null,
  },
  reducers: {
    setModels(state, action: PayloadAction<string[]>) {
      state.models = action.payload;
    },
  },
});

export const { setModels } = modelsSlice.actions;

export default modelsSlice.reducer;
