import { useState } from "react";
import { ChatCompletionMessageParam } from "openai/resources/index";

import { useSyncFS } from "./fs/hooks";

const messagesFallback: ChatCompletionMessageParam[] = [];

export function useMessages() {
  const [messages, setMessages] = useState<ChatCompletionMessageParam[] | null>(
    null
  );

  useSyncFS({
    path: "/root/.flareagent/messages.json",
    value: messages,
    setValue: setMessages,
    fallbackValue: messagesFallback,
  });

  return [messages, setMessages] as const;
}
