import { createAsyncThunk } from "@reduxjs/toolkit";
import { AppState } from "../store";
import {
  ChatCompletion,
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";
import { createMessage, updatePartialMessage } from ".";

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

const fetchDrawings = createAsyncThunk(
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

const fetchAssistantMessage = createAsyncThunk(
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

const thunks = {
  fetchDrawings,
  fetchAssistantMessage,
};

export default thunks;
