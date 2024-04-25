import { createSlice } from "@reduxjs/toolkit";

export type Conversations = {
  id: string;
  title: string | null;
  create_time: string;
};

export const conversationsSlice = createSlice({
  name: "conversations",
  initialState: {
    conversations: [] as Conversations[],
    currentConversation: null as string | null,
  },
  reducers: {
    addConversation(state, action) {
      state.conversations.push(action.payload);
    },
    removeConversation(state, action) {
      state.conversations = state.conversations.filter(
        (conversation) => conversation.id !== action.payload
      );
    },
  },
});

export const { addConversation, removeConversation } =
  conversationsSlice.actions;

export default conversationsSlice.reducer;
