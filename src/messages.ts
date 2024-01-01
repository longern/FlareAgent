import React, { useCallback } from "react";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

function messagesReducer(
  messages: ChatCompletionMessageParam[],
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
      return [...messages, action.message];
    case "set":
      return action.messages;
    case "clear":
      return [];
    default:
      throw new Error();
  }
}

export function useMessages() {
  const [messages, dispatch] = React.useReducer(messagesReducer, []);

  const addMessage = useCallback((message: ChatCompletionMessageParam) => {
    dispatch({ type: "add", message });
  }, []);

  const setMessages = useCallback((messages: ChatCompletionMessageParam[]) => {
    dispatch({ type: "set", messages });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  return { messages, addMessage, setMessages, clearMessages };
}
