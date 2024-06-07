import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  ChatCompletion,
  ChatCompletionMessageToolCall,
} from "openai/resources/index.mjs";
import { OpenAPIV3 } from "openapi-types";
import YAML from "yaml";

import {
  ChatCompletionExecutionOutput,
  createMessage,
  updatePartialMessage,
} from ".";
import { apisToTool } from "../../tools";
import { AppState } from "../store";
import { setAbortable } from "../abort";
import { messageToChat } from "./utils";
import { showError } from "../error";

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

async function invokeTools(
  tools: ReturnType<typeof apisToTool>,
  toolCalls: ChatCompletionMessageToolCall[],
  signal?: AbortSignal
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
      const response = await fetch(url, { method, body, signal });
      return response.text();
    })
  );
  return results;
}

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

    const messages = Object.values(conversation.messages).map(messageToChat);

    const systemPromptSegments: string[] = [];
    if (state.settings.systemPrompt) {
      systemPromptSegments.push(state.settings.systemPrompt);
    }

    if (state.settings.enableMemory) {
      const memories = Object.values(state.memories.memories);
      systemPromptSegments.push("Memories:");
      systemPromptSegments.push(
        ...memories.map((memory, index) => `${index}. ${memory.content}`)
      );
    }

    if (systemPromptSegments.length > 0) {
      messages.unshift({
        role: "system",
        content: systemPromptSegments.join("\n"),
      });
    }

    const enabledTools = Object.values(state.tools.tools)
      .filter((tool) => tool.enabled)
      .map((tool) => YAML.parse(tool.definition) as OpenAPIV3.Document);
    const tools = apisToTool(enabledTools);

    const completion = await openai.chat.completions.create(
      {
        model,
        messages: messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: state.settings.temperature,
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
          content: [{ type: "text", text: content }],
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
        content: choice.message.tool_calls ?? [
          { type: "text", text: choice.message.content ?? "" },
        ],
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
          content: [
            {
              type: "execution_output",
              name,
              tool_call_id: toolCallId,
              output:
                result.status === "fulfilled" ? result.value : result.reason,
            } as ChatCompletionExecutionOutput,
          ],
          create_time: Date.now(),
        })
      );
    }

    const resultContentLength = toolsResult.reduce(
      (acc, result) =>
        acc + (result.status === "fulfilled" ? result.value.length : 0),
      0
    );
    if (
      resultContentLength >= 8192 ||
      toolsResult.some((result) => result.status === "rejected")
    )
      return;

    setTimeout(() => {
      const promise = dispatch(fetchAssistantMessage(model));
      promise
        .unwrap()
        .catch((error) => dispatch(showError({ message: error.message })))
        .finally(() => dispatch(setAbortable(null)));
    }, 4);
  }
);

const thunks = {
  fetchAssistantMessage,
};

export default thunks;
