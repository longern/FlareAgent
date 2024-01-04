import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Fab,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowDownward as ArrowDownwardIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/index.mjs";
import type { OpenAPIV3 } from "openapi-types";

import MessageList from "./MessageList";
import MobileToolbar from "./MobileToolbar";
import Sidebar from "./Sidebar";
import ScrollToBottom from "./ScrollToBottom";
import { useMessages } from "./messages";
import { Tool, apisToTool } from "./tools";

const MessageListPlaceholder = (
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
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [tools, setTools] = useState<OpenAPIV3.Document[]>([]);
  const { messages, addMessage, clearMessages } = useMessages();
  const [userInput, setUserInput] = useState<string>("");
  const [needAssistant, setNeedAssistant] = useState<boolean>(false);
  const [model, setModel] = useState<string>("gpt-3.5-turbo-1106");
  const [scrollToBottom, setScrollToBottom] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const userInputRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<string>(model);

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  const fetchTools = useCallback(async () => {
    await import("./tools");
    const response = await fetch("tool://");
    const data: { tools: string[] } = await response.json();
    const tools = await Promise.all(
      data.tools.map(async (url) => {
        const response = await fetch(url);
        const tool: OpenAPIV3.Document = await response.json();
        return tool;
      })
    );
    setTools(tools);
  }, []);

  const fetchCompletion = useCallback(
    async ({
      model,
      messages,
      tools,
    }: {
      model: string;
      messages: ChatCompletionMessageParam[];
      tools: Tool[];
    }) => {
      const openaiApiKey = localStorage.getItem("openaiApiKey");
      const openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true,
      });
      const response = await openai.chat.completions.create({
        model,
        messages,
        tools:
          tools.length === 0
            ? undefined
            : tools.map((tool) => ({
                type: "function",
                function: tool.function,
              })),
      });

      if (response.choices.length > 0) {
        const choice = response.choices[0];

        setNeedAssistant(false);
        addMessage(response.choices[0].message);

        if (choice.finish_reason === "tool_calls") {
          const tool_calls = choice.message.tool_calls;
          const results = await Promise.all(
            tool_calls.map(
              async (tool_call): Promise<ChatCompletionToolMessageParam> => {
                const tool = tools.find(
                  (tool) => tool.function.name === tool_call.function.name
                );
                if (!tool)
                  return {
                    role: "tool",
                    tool_call_id: tool_call.id,
                    content: "Tool not found",
                  };
                const response = await fetch(tool.endpoint, {
                  method: tool.method,
                  headers: { "Content-Type": "application/json" },
                  body: tool_call.function.arguments,
                });
                return {
                  role: "tool",
                  tool_call_id: tool_call.id,
                  content: await response.text(),
                };
              }
            )
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
    fetchCompletion({
      model: modelRef.current,
      messages,
      tools: apisToTool(tools),
    }).catch((error) => setError(error.message));
  }, [fetchCompletion, messages, needAssistant, tools]);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  const models = ["gpt-3.5-turbo-1106", "gpt-4-1106-preview"];
  const ModelSelector = (
    <Select
      variant="standard"
      value={model}
      onChange={(e) => {
        setModel(e.target.value);
      }}
      inputProps={{ "aria-label": "model" }}
    >
      {models.map((model) => (
        <MenuItem key={model} value={model}>
          {model}
        </MenuItem>
      ))}
    </Select>
  );
  return (
    <Stack height="100%">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={clearMessages}
        modelSelector={matchesLg ? ModelSelector : undefined}
        tools={tools}
      />
      {!matchesLg && (
        <MobileToolbar
          modelSelector={ModelSelector}
          onMenuClick={() => setSidebarOpen(true)}
          onCreateThread={clearMessages}
        />
      )}
      <Box sx={{ minHeight: 0, flexGrow: 1 }}>
        {messages.length === 0 ? (
          MessageListPlaceholder
        ) : (
          <ScrollToBottom
            scrollToBottom={scrollToBottom}
            component={Box}
            sx={{ height: "100%", overflow: "auto" }}
            onScrollToBottomChange={setScrollToBottom}
          >
            <Container maxWidth="md" sx={{ padding: 1 }}>
              <MessageList messages={messages} />
            </Container>
          </ScrollToBottom>
        )}
      </Box>
      <Container maxWidth="md">
        <TextField
          ref={userInputRef}
          value={userInput}
          multiline
          fullWidth
          size="small"
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (matchesLg && e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
              e.preventDefault();
              if (userInput === "") return;
              addMessage({ role: "user", content: userInput });
              setNeedAssistant(true);
              setUserInput("");
              userInputRef.current.blur();
            }
          }}
          sx={{ flexShrink: 0, marginY: 1 }}
          inputProps={{ "aria-label": "user input" }}
          InputProps={{
            sx: { borderRadius: "16px" },
            endAdornment: (
              <IconButton
                aria-label="send"
                size="small"
                disabled={userInput === ""}
                onClick={() => {
                  addMessage({ role: "user", content: userInput });
                  setNeedAssistant(true);
                  setUserInput("");
                  userInputRef.current.blur();
                }}
                sx={{ alignSelf: "flex-end" }}
              >
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </Container>
      <Snackbar
        color="error"
        open={error !== null}
        onClose={() => setError(null)}
        message={error}
      />
      {!scrollToBottom && (
        <Fab
          size="small"
          sx={{
            position: "absolute",
            bottom: 80,
            right: 16,
            zIndex: 1,
          }}
          onClick={() => {
            setScrollToBottom(true);
          }}
        >
          <ArrowDownwardIcon />
        </Fab>
      )}
    </Stack>
  );
}

export default App;
