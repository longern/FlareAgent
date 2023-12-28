import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Snackbar,
  Stack,
  TextField,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from "openai/resources/index.mjs";

import MobileToolbar from "./MobileToolbar";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";

function messagesReducer(
  messages: ChatCompletionMessageParam[],
  action: {
    type: "add";
    message: ChatCompletionMessageParam;
  }
) {
  switch (action.type) {
    case "add":
      return [...messages, action.message];
    default:
      throw new Error();
  }
}

function useMessages() {
  const [messages, dispatch] = React.useReducer(messagesReducer, []);

  const addMessage = useCallback((message: ChatCompletionMessageParam) => {
    dispatch({ type: "add", message });
  }, []);

  return [messages, addMessage] as const;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [tools, setTools] = useState<ChatCompletionTool[]>([]);
  const [messages, addMessage] = useMessages();
  const [userInput, setUserInput] = useState<string>("");
  const [needAssistant, setNeedAssistant] = useState<boolean>(false);
  const [model, setModel] = useState<string>("gpt-3.5-turbo");
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<string>(model);

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  const fetchTools = useCallback(async () => {
    const response = await fetch("/tools");
    const data: { tools: ChatCompletionTool[] } = await response.json();
    setTools(data.tools);
  }, []);

  const fetchCompletion = useCallback(
    async ({
      model,
      messages,
      tools,
    }: {
      model: string;
      messages: ChatCompletionMessageParam[];
      tools: ChatCompletionTool[];
    }) => {
      const openaiApiKey = localStorage.getItem("openaiApiKey");
      const openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true,
      });
      const response = await openai.chat.completions.create({
        model,
        messages,
        tools,
      });

      if (response.choices.length > 0) {
        const choice = response.choices[0];

        setNeedAssistant(false);
        addMessage(response.choices[0].message);

        if (choice.finish_reason === "tool_calls") {
          const tool_calls = choice.message.tool_calls;
          const results = await Promise.all(
            tool_calls.map(async (tool_call) => {
              const response = await fetch(
                `/tools/${tool_call.function.name}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: tool_call.function.arguments,
                }
              );
              const toolMessage = {
                role: "tool",
                tool_call_id: tool_call.id,
                content: await response.text(),
              } as ChatCompletionToolMessageParam;
              return toolMessage;
            })
          );
          results.forEach((result) => addMessage(result));
          setNeedAssistant(true);
        }
      }

      return response;
    },
    [addMessage]
  );

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  useEffect(() => {
    if (!needAssistant) return;
    fetchCompletion({ model: modelRef.current, messages, tools }).catch(
      (error) => setError(error.message)
    );
  }, [fetchCompletion, messages, needAssistant, tools]);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  return (
    <Stack height="100%">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {!matchesLg && (
        <MobileToolbar
          models={["gpt-3.5-turbo", "gpt-4"]}
          modelValue={model}
          onMenuClick={() => setSidebarOpen(true)}
          onModelChange={(model) => setModel(model)}
          onCreateThread={() => {}}
        />
      )}
      <Box sx={{ minHeight: 0, flexGrow: 1, overflow: "auto" }}>
        {messages.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" sx={{ color: "text.secondary" }}>
              Start chatting with the assistant!
            </Typography>
          </Box>
        ) : (
          <Container maxWidth="md" sx={{ padding: 1 }}>
            <MessageList messages={messages} />
          </Container>
        )}
      </Box>
      <Container maxWidth="md">
        <TextField
          value={userInput}
          fullWidth
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addMessage({ role: "user", content: userInput });
              setNeedAssistant(true);
              setUserInput("");
            }
          }}
          sx={{ flexShrink: 0, marginY: "4px" }}
          InputProps={{ sx: { borderRadius: "14px" } }}
        />
      </Container>
      <Snackbar
        color="error"
        open={error !== null}
        onClose={() => setError(null)}
        message={error}
      />
    </Stack>
  );
}

export default App;
