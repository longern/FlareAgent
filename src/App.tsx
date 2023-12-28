import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Container,
  Stack,
  TextField,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  Build as BuildIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
} from "@mui/icons-material";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from "openai/resources/index.mjs";
import MobileToolbar from "./MobileToolbar";

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
  const [tools, setTools] = useState<ChatCompletionTool[]>([]);
  const [messages, addMessage] = useMessages();
  const [userInput, setUserInput] = useState<string>("");
  const [needAssistant, setNeedAssistant] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [model, setModel] = useState<string>("gpt-3.5-turbo");
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
      (error) => setError(error)
    );
  }, [fetchCompletion, messages, needAssistant, tools]);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  return (
    <Stack height="100%">
      {!matchesLg && (
        <MobileToolbar
          models={["gpt-3.5-turbo", "gpt-4"]}
          modelValue={model}
          onMenuClick={() => {}}
          onModelChange={(model) => setModel(model)}
          onCreateThread={() => {}}
        />
      )}
      <Container
        maxWidth="md"
        sx={{
          minHeight: 0,
          overflow: "auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: 1,
        }}
      >
        <Stack spacing={2} overflow="auto" direction="column-reverse">
          {messages.toReversed().map((message, index) => (
            <Stack
              key={index}
              direction={message.role === "user" ? "row-reverse" : "row"}
              spacing={1}
            >
              {message.role === "user" ? (
                <Avatar>
                  <PersonIcon />
                </Avatar>
              ) : message.role === "assistant" ? (
                <Avatar sx={{ backgroundColor: "#19c37d" }}>
                  <SmartToyIcon />
                </Avatar>
              ) : message.role === "tool" ? (
                <Avatar>
                  <BuildIcon />
                </Avatar>
              ) : (
                <Avatar>?</Avatar>
              )}
              <Box
                key={index}
                sx={{
                  minWidth: 0,
                  overflowWrap: "break-word",
                  padding: "0.5em 0.8em",
                  borderRadius: "14px",
                  backgroundColor:
                    message.role === "user" ? "#e0e0e0" : "#f5f5f5",
                }}
              >
                <span>{message.content as string}</span>
                <span>
                  {message.role === "assistant" &&
                  message.tool_calls?.length > 0
                    ? "Calling function: " +
                      message.tool_calls.map(
                        (tool_call) => tool_call.function.name
                      )
                    : null}
                </span>
              </Box>
              <Box flexShrink={0} width={48} />
            </Stack>
          ))}
          {error && <div>{error.message}</div>}
        </Stack>
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {messages.length === 0 && (
            <Typography variant="h6" sx={{ color: "text.secondary" }}>
              Start chatting with the assistant!
            </Typography>
          )}
        </Box>
        <TextField
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addMessage({ role: "user", content: userInput });
              setNeedAssistant(true);
              setUserInput("");
            }
          }}
          sx={{ flexShrink: 0, marginTop: "4px" }}
          InputProps={{ sx: { borderRadius: "14px" } }}
        />
      </Container>
    </Stack>
  );
}

export default App;
