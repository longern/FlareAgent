import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/index.mjs";

import { Message } from ".";

export function messageToChat(message: Message): ChatCompletionMessageParam {
  const content = message.content;
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
