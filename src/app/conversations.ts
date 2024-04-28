import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type Conversation = {
  id: string;
  title: string | null;
  create_time: string;
  messages: string[];
};

export const conversationsSlice = createSlice({
  name: "conversations",
  initialState: {
    conversations: {} as Record<string, Conversation>,
    currentConversationId: null as string | null,
  },
  reducers: {
    removeConversation(state, action: PayloadAction<string>) {
      delete state.conversations[action.payload];
      if (state.currentConversationId === action.payload) {
        state.currentConversationId = null;
      }
    },
    resetCurrentConversation(state) {
      state.currentConversationId = null;
    },
    setCurrentConversation(state, action: PayloadAction<string>) {
      state.currentConversationId = action.payload;
    },
    updateCurrentConversation(state, action: PayloadAction<string[]>) {
      if (state.currentConversationId === null) {
        const id = crypto.randomUUID();
        state.conversations[id] = {
          id,
          title: action.payload[0].slice(0, 10) || "Untitled",
          create_time: new Date().toISOString(),
          messages: action.payload,
        };
        state.currentConversationId = id;
        return;
      }
      const current = state.conversations[state.currentConversationId!];
      current.messages = action.payload;
    },
  },
});

export const {
  removeConversation,
  resetCurrentConversation,
  setCurrentConversation,
  updateCurrentConversation,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;
