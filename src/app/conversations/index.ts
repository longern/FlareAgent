import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import conversationThunks from "./thunks";

export type Message = {
  id: string;
  author_role: "user" | "assistant" | "system" | "tool" | "function";
  content: string;
  create_time: number;
};

export type Conversation = {
  id: string;
  title: string | null;
  create_time: number;
  messages: Record<string, Message>;
};

export const conversationsSlice = createSlice({
  name: "conversations",
  initialState: {
    conversations: null as Record<string, Conversation> | null,
    currentConversationId: null as string | null,
  },
  reducers: {
    createConversation(
      state,
      action: PayloadAction<{
        id: string;
        title: string;
        create_time: number;
        messages: Record<string, Message>;
      }>
    ) {
      const id = action.payload.id;
      state.conversations = { [id]: action.payload, ...state.conversations };
      state.currentConversationId = id;
    },
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = Object.fromEntries(
        action.payload.map((conversation) => [conversation.id, conversation])
      );
    },
    updateConversationTitle(
      state,
      action: PayloadAction<{ id: string; title: string }>
    ) {
      const id = action.payload.id;
      state.conversations[id].title = action.payload.title;
    },
    removeConversation(state, action: PayloadAction<string>) {
      delete state.conversations[action.payload];
      if (state.currentConversationId === action.payload) {
        state.currentConversationId = null;
      }
    },
    setCurrentConversation(state, action: PayloadAction<string | null>) {
      state.currentConversationId = action.payload;
    },

    setMessages(state, action: PayloadAction<Record<string, Message>>) {
      const conversation = state.conversations[state.currentConversationId!];
      conversation.messages = action.payload;
    },

    createMessage(state, action: PayloadAction<Message>) {
      const conversation = state.conversations[state.currentConversationId!];
      conversation.messages[action.payload.id] = action.payload;
    },

    updatePartialMessage(state, action: PayloadAction<Message>) {
      const conversation = state.conversations[state.currentConversationId!];
      conversation.messages[action.payload.id] = action.payload;
    },
  },
});

export async function archiveConversation(conversation: Conversation) {
  fetch("/api/conversations", {
    method: "POST",
    body: JSON.stringify(conversation),
  });
}

export const {
  createConversation,
  setConversations,
  updateConversationTitle,
  removeConversation,
  setCurrentConversation,
  createMessage,
  updatePartialMessage,
} = conversationsSlice.actions;

export const { fetchAssistantMessage, fetchDrawings } = conversationThunks;

export default conversationsSlice.reducer;
