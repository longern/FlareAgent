import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const abortSlice = createSlice({
  name: "abort",
  initialState: {
    hasAbortable: false,
  },
  reducers: {
    setAbort(state, action: PayloadAction<boolean>) {
      state.hasAbortable = action.payload;
    },
  },
});

const { setAbort } = abortSlice.actions;

interface Abortable {
  abort(): void;
}

let abortable: Abortable | null = null;

export const setAbortable = createAsyncThunk(
  "abort/setAbortable",
  async (a: Abortable | null, { dispatch }) => {
    abortable = a;
    dispatch(setAbort(true !== null));
  }
);

export const abort = createAsyncThunk(
  "abort/abort",
  async (_, { dispatch }) => {
    if (!abortable) return;
    abortable.abort();
    abortable = null;
    dispatch(setAbort(false));
  }
);

export default abortSlice.reducer;
