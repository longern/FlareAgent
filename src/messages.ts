import React, { useCallback } from "react";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

import { useSyncFS } from "./fs/hooks";

function messagesReducer(
  messages: ChatCompletionMessageParam[] | null,
  action:
    | {
        type: "add";
        message: ChatCompletionMessageParam;
      }
    | {
        type: "set";
        messages: ChatCompletionMessageParam[];
      }
    | {
        type: "clear";
      }
) {
  switch (action.type) {
    case "add":
      if (messages === null) return null;
      return [...messages, action.message];
    case "set":
      return action.messages;
    case "clear":
      return [];
    default:
      throw new Error();
  }
}

const messagesFallback: ChatCompletionMessageParam[] = [];

export function useMessages() {
  const [messages, dispatch] = React.useReducer(messagesReducer, null);

  const addMessage = useCallback((message: ChatCompletionMessageParam) => {
    dispatch({ type: "add", message });
  }, []);

  const setMessages = useCallback((messages: ChatCompletionMessageParam[]) => {
    dispatch({ type: "set", messages });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  useSyncFS({
    path: "/root/.flareagent/messages.json",
    value: messages,
    setValue: setMessages,
    fallback: messagesFallback,
  });

  return { messages, addMessage, setMessages, clearMessages };
}
