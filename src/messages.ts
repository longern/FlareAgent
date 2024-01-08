import React, { useCallback, useEffect } from "react";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { FS } from "./fs";

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

  useEffect(() => {
    if (messages !== null) return;
    FS.readFile("/root/FlareAgent/messages.json")
      .then((contents) => {
        setMessages(
          contents ? JSON.parse(new TextDecoder().decode(contents)) : []
        );
      })
      .catch(() => setMessages([]));
  }, [messages, setMessages]);

  useEffect(() => {
    if (messages === null) return;
    FS.mkdir("/root/FlareAgent")
      .then(() =>
        FS.writeFile(
          "/root/FlareAgent/messages.json",
          new Int8Array(new TextEncoder().encode(JSON.stringify(messages)))
        )
      )
      .catch(() => {});
  }, [messages]);

  return { messages, addMessage, setMessages, clearMessages };
}
