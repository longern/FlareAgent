import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AppState } from "./store";
import {
  ChatCompletion,
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";

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
    conversations: {} as Record<string, Conversation>,
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
      state.conversations = {
        [id]: action.payload,
        ...state.conversations,
      };
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

function patchDelta(obj: any, delta: any) {
  if (Array.isArray(delta)) {
    const newObj = obj ? [...obj] : [];
    delta.forEach((item: { index: number; [key: string]: any }) => {
      const { index, ...rest } = item;
      newObj[index] = patchDelta(newObj[index], rest);
    });
    return newObj;
  } else if (delta === null) {
    return null;
  } else if (typeof delta === "object") {
    const newObj = obj ? { ...obj } : {};
    for (const key in delta) {
      newObj[key] = patchDelta(newObj[key], delta[key]);
    }
    return newObj;
  } else if (typeof delta === "string") {
    return (obj ?? "") + delta;
  }
  return delta;
}

export const fetchDrawings = createAsyncThunk(
  "conversations/fetchDrawings",
  async (prompt: string, { dispatch, signal }) => {
    const { OpenAI } = await import("openai");
    const openaiApiKey = localStorage.getItem("OPENAI_API_KEY") ?? "";
    const baseURL = localStorage.getItem("OPENAI_BASE_URL");
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
    const completion = await openai.images.generate(
      {
        model: "dall-e-3",
        prompt,
        response_format: "b64_json",
      },
      { signal }
    );
    const messageId = crypto.randomUUID();
    const imageUrl = "data:image/png;base64," + completion.data[0].b64_json;
    dispatch(
      createMessage({
        id: messageId,
        author_role: "assistant",
        content: JSON.stringify([
          {
            type: "image_url",
            image_url: { url: imageUrl },
          } as ChatCompletionContentPart,
        ]),
        create_time: Date.now(),
      })
    );
  }
);

export const fetchAssistantMessage = createAsyncThunk(
  "conversations/fetchAssistantMessage",
  async (model: string, { getState, dispatch, signal }) => {
    const state = getState() as AppState;
    const conversation =
      state.conversations.conversations[
        state.conversations.currentConversationId
      ];
    const { OpenAI } = await import("openai");
    const openaiApiKey = localStorage.getItem("OPENAI_API_KEY") ?? "";
    const baseURL = localStorage.getItem("OPENAI_BASE_URL");
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
    const messages = Object.values(conversation.messages).map(
      (message) =>
        ({
          role: message.author_role,
          content: JSON.parse(message.content),
        } as ChatCompletionMessageParam)
    );

    const completion = await openai.chat.completions.create(
      {
        model,
        messages: messages,
        stream: true,
      },
      { signal }
    );

    const messageId = crypto.randomUUID();
    const timestamp = Date.now();
    const choices: ChatCompletion.Choice[] = [];
    for await (const chunk of completion) {
      for (const chunkChoice of chunk.choices) {
        const { index, delta, finish_reason } = chunkChoice;
        if (choices.length <= index)
          choices[index] = {} as ChatCompletion.Choice;
        const choice = choices[index];
        choice.finish_reason = finish_reason!;
        choice.message = patchDelta(choice.message, delta);
        dispatch(
          updatePartialMessage({
            id: messageId,
            author_role: "assistant",
            content: JSON.stringify(choice.message.content),
            create_time: timestamp,
          })
        );
      }
    }

    if (choices.length === 0) {
      throw new Error("No response from OpenAI API");
    }
    const choice = choices[0];
    dispatch(
      createMessage({
        id: messageId,
        author_role: "assistant",
        content: JSON.stringify(choice.message.content),
        create_time: timestamp,
      })
    );
  }
);

export const {
  createConversation,
  setConversations,
  updateConversationTitle,
  removeConversation,
  setCurrentConversation,
  createMessage,
  updatePartialMessage,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;
