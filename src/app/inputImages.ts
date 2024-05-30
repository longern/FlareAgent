import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const inputImagesSlice = createSlice({
  name: "inputImages",
  initialState: {
    images: [] as string[],
  },
  reducers: {
    setInputImages(state, action: PayloadAction<string[]>) {
      state.images = action.payload;
    },
  },
});

export const { setInputImages } = inputImagesSlice.actions;

export default inputImagesSlice.reducer;
