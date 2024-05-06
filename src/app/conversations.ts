import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ChatCompletionContentPart } from "openai/resources/index.mjs";

export type Message = {
  author: {
    role: "user" | "assistant" | "system" | "tool" | "function";
  };
  id: string;
  content: string | ChatCompletionContentPart[];
  create_time: string;
};

export type Conversation = {
  id: string;
  title: string | null;
  create_time: string;
  messages: Record<string, Message>;
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
    updateCurrentConversation(
      state,
      action: PayloadAction<Record<string, Message>>
    ) {
      const messages = action.payload;
      const content = Array.from(Object.values(messages))[0].content;
      if (state.currentConversationId === null) {
        const id = crypto.randomUUID();
        state.conversations[id] = {
          id,
          title:
            (typeof content === "string" ? content : "").trim().slice(0, 10) ||
            "Untitled",
          create_time: new Date().toISOString(),
          messages,
        };
        state.currentConversationId = id;
        return;
      }
      const current = state.conversations[state.currentConversationId!];
      current.messages = messages;
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
  removeConversation,
  resetCurrentConversation,
  setCurrentConversation,
  updateCurrentConversation,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;
