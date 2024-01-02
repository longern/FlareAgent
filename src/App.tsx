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
  Send as SendIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from "openai/resources/index.mjs";

import MessageList from "./MessageList";
import MobileToolbar from "./MobileToolbar";
import Sidebar from "./Sidebar";
import ScrollToBottom from "./ScrollToBottom";
import { useMessages } from "./messages";

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
  const [tools, setTools] = useState<ChatCompletionTool[]>([]);
  const { messages, addMessage, clearMessages } = useMessages();
  const [userInput, setUserInput] = useState<string>("");
  const [needAssistant, setNeedAssistant] = useState<boolean>(false);
  const [model, setModel] = useState<string>("gpt-3.5-turbo");
  const [scrollToBottom, setScrollToBottom] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const userInputRef = useRef<HTMLDivElement | null>(null);
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
        tools: tools.length === 0 ? undefined : tools,
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

  const models = ["gpt-3.5-turbo", "gpt-4"];
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
        modelSelector={matchesLg ? ModelSelector : undefined}
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
          color="primary"
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
