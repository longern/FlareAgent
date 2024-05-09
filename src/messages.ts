import { useState } from "react";
import { ChatCompletionMessageParam } from "openai/resources/index";

export function useMessages() {
  const [messages, setMessages] = useState<ChatCompletionMessageParam[] | null>(
    null
  );

  return [messages, setMessages] as const;
}
