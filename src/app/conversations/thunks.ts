import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  ChatCompletion,
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/index.mjs";
import { OpenAPIV3 } from "openapi-types";

import { createMessage, updatePartialMessage } from ".";
import { apisToTool } from "../../tools";
import { AppState } from "../store";

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

async function invokeTools(
  tools: ReturnType<typeof apisToTool>,
  toolCalls: ChatCompletionMessageToolCall[]
) {
  const results = Promise.allSettled(
    toolCalls.map(async (toolCall) => {
      const tool = tools.find(
        (tool) => tool.function.name === toolCall.function.name
      );
      if (!tool) throw new Error(`Tool not found: ${toolCall.function.name}`);
      const url = tool.endpoint;
      const method = tool.method;
      const body = toolCall.function.arguments;
      const response = await fetch(url, { method, body });
      return response.text();
    })
  );
  return results;
}

export type ChatCompletionExecutionOutput = {
  type: "execution_output";
  name: string;
  tool_call_id: string;
  output: string;
};

export type ChatCompletionContent =
  | string
  | Array<
      | ChatCompletionContentPart
      | ChatCompletionMessageToolCall
      | ChatCompletionExecutionOutput
    >;

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
      (message): ChatCompletionMessageParam => {
        const content = JSON.parse(message.content) as ChatCompletionContent;
        if (
          typeof content === "object" &&
          Array.isArray(content) &&
          content.length > 0 &&
          content[0].type === "function"
        ) {
          return {
            role: "assistant",
            content: null,
            tool_calls: content as ChatCompletionMessageToolCall[],
          };
        } else if (
          typeof content === "object" &&
          Array.isArray(content) &&
          content.length > 0 &&
          content[0].type === "execution_output"
        ) {
          return {
            role: "tool",
            tool_call_id: content[0].tool_call_id,
            content: content[0].output,
          };
        }
        return {
          role: message.author_role,
          content,
        } as ChatCompletionMessageParam;
      }
    );

    if (state.settings.systemPrompt) {
      messages.unshift({
        role: "system",
        content: state.settings.systemPrompt,
      });
    }

    const enabledTools = Object.values(state.tools.tools)
      .filter((tool) => tool.enabled)
      .map((tool) => JSON.parse(tool.definition) as OpenAPIV3.Document);
    const tools = apisToTool(enabledTools);

    const completion = await openai.chat.completions.create(
      {
        model,
        messages: messages,
        stream: true,
        tools: tools.length > 0 ? tools : undefined,
      },
      { signal }
    );

    const messageId = crypto.randomUUID();
    const timestamp = Date.now();
    function onPartialMessage(content: string) {
      dispatch(
        updatePartialMessage({
          id: messageId,
          author_role: "assistant",
          content: JSON.stringify(content),
          create_time: timestamp,
        })
      );
    }

    const choices: ChatCompletion.Choice[] = [];
    for await (const chunk of completion) {
      for (const chunkChoice of chunk.choices) {
        const { index, delta, finish_reason } = chunkChoice;
        if (choices.length <= index)
          choices[index] = {} as ChatCompletion.Choice;
        const choice = choices[index];
        choice.finish_reason = finish_reason!;
        choice.message = patchDelta(choice.message, delta);
        onPartialMessage(choice.message.content ?? "");
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
        content: choice.message.tool_calls
          ? JSON.stringify(choice.message.tool_calls)
          : JSON.stringify(choice.message.content ?? ""),
        create_time: timestamp,
      })
    );

    if (!choice.message.tool_calls) return;
    const toolsResult = await invokeTools(tools, choice.message.tool_calls);
    for (const [index, result] of toolsResult.entries()) {
      const toolCallId = choice.message.tool_calls[index].id;
      const name = choice.message.tool_calls[index].function.name;
      dispatch(
        createMessage({
          id: crypto.randomUUID(),
          author_role: "tool",
          content: JSON.stringify([
            {
              type: "execution_output",
              name,
              tool_call_id: toolCallId,
              output:
                result.status === "fulfilled" ? result.value : result.reason,
            },
          ] as ChatCompletionContent),
          create_time: Date.now(),
        })
      );
    }

    dispatch(fetchAssistantMessage(model));
  }
);

const thunks = {
  fetchDrawings,
  fetchAssistantMessage,
};

export default thunks;
