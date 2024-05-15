import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Memory {
  id: string;
  content: string;
  create_time: number;
}

export const memoriesSlice = createSlice({
  name: "memories",
  initialState: {
    memories: null as Record<string, Memory> | null,
  },
  reducers: {
    setMemories(state, action: PayloadAction<Memory[]>) {
      state.memories = Object.fromEntries(
        action.payload.map((memory) => [memory.id, memory])
      );
    },
    createMemory(state, action: PayloadAction<Memory>) {
      state.memories[action.payload.id] = action.payload;
    },
    deleteMemory(state, action: PayloadAction<string>) {
      delete state.memories[action.payload];
    },
    clearMemories(state) {
      state.memories = {};
    },
  },
});

export const { setMemories, createMemory, deleteMemory, clearMemories } =
  memoriesSlice.actions;

export default memoriesSlice.reducer;
