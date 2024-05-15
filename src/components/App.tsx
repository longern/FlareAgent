import React, { useCallback, useRef, useState } from "react";
import {
  Box,
  Container,
  Divider,
  Stack,
  Theme,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { ChatCompletionContentPart } from "openai/resources/index.mjs";
import type { Options as HtmlToImageOptions } from "html-to-image/lib/types";

import { ScrollToBottomButton, StopButton } from "./ActionButtons";
import MessageList from "./main/MessageList";
import MobileToolbar from "./sidebar/MobileToolbar";
import Sidebar from "./sidebar/Sidebar";
import ScrollToBottom from "./main/ScrollToBottom";
import UserInput from "./main/UserInput";
import { Workflow, defaultWorkflow } from "../workflow";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  createConversation,
  createMessage,
  fetchAssistantMessage,
  fetchDrawings,
  setCurrentConversation,
} from "../app/conversations";
import { abort, setAbortable } from "../app/abort";
import { showError } from "../app/error";

async function screenshot(element: HTMLElement, options: HtmlToImageOptions) {
  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(element, options);
  const clipboardItem = new ClipboardItem({ [blob.type]: blob });
  navigator.clipboard.write([clipboardItem]);
}

function extractTitle(userInput: string | ChatCompletionContentPart[]) {
  return (
    typeof userInput === "string"
      ? userInput
      : userInput
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("")
  ).slice(0, 10);
}

function useHandleSend() {
  const model = useAppSelector((state) => state.models.model);
  const currentConversationId = useAppSelector(
    (state) => state.conversations.currentConversationId
  );
  const dispatch = useAppDispatch();

  return useCallback(
    (userInput: string | ChatCompletionContentPart[]) => {
      const messageId = crypto.randomUUID();
      const timestamp = Date.now();
      const message = {
        id: messageId,
        author_role: "user" as const,
        content: JSON.stringify(userInput),
        create_time: timestamp,
      };
      dispatch(
        currentConversationId
          ? createMessage(message)
          : createConversation({
              id: crypto.randomUUID(),
              title: extractTitle(userInput) || "Untitled",
              create_time: timestamp,
              messages: { [messageId]: message },
            })
      );
      const promise = dispatch(
        model === "dall-e-3"
          ? fetchDrawings(userInput as string)
          : fetchAssistantMessage(model)
      );
      dispatch(setAbortable(promise));
      promise
        .unwrap()
        .catch((error) => dispatch(showError({ message: error.message })))
        .finally(() => dispatch(setAbortable(null)));
    },
    [dispatch, currentConversationId, model]
  );
}

function App() {
  const [currentWorkflow, setCurrentWorkflow] = useState(defaultWorkflow);
  const [variables, setVariables] = useState<Map<string, string>>(new Map());

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [scrollToBottom, setScrollToBottom] = useState<boolean>(true);
  const hasAbortable = useAppSelector((state) => state.abort.hasAbortable);
  const disableMemory = useAppSelector((state) => state.settings.disableMemory);
  const dispatch = useAppDispatch();

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const theme = useTheme();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const executeWorkflowStepCallback = async () => {
    variables.set("MEMORIES", "");
    if (!disableMemory) {
      await import("../tools/scheme");
      await fetch("tool://memories")
        .then(async (response) => {
          if (!response.ok) throw new Error("Failed to fetch memories");
          const memories = (await response.json()) as string[];
          variables.set(
            "MEMORIES",
            memories.map((memory, index) => `[${index}] ${memory}\n`).join("")
          );
        })
        .catch(() => {});
    }
  };
  const executeWorkflowStepRef = useRef(executeWorkflowStepCallback);
  executeWorkflowStepRef.current = executeWorkflowStepCallback;

  const handleNewChat = useCallback(() => {
    setVariables(new Map());
    setSidebarOpen(false);
    dispatch(setCurrentConversation(null));
    dispatch(abort());
  }, [dispatch]);

  const handleWorkflowChange = useCallback(
    (workflow: Workflow) => {
      setCurrentWorkflow(workflow);
      handleNewChat();
    },
    [handleNewChat]
  );

  const handleSend = useHandleSend();

  return (
    <Stack direction="row" height="100%">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        currentWorkflow={currentWorkflow}
        onWorkflowChange={handleWorkflowChange}
      />
      <Stack minWidth={0} flexGrow={1}>
        {!matchesLg && (
          <MobileToolbar
            onMenuClick={() => setSidebarOpen(true)}
            onCreateThread={handleNewChat}
          />
        )}
        <Box sx={{ minHeight: 0, flexGrow: 1 }}>
          <ScrollToBottom
            scrollToBottom={scrollToBottom}
            component={Box}
            sx={{ height: "100%", overflow: "auto" }}
            onScrollToBottomChange={setScrollToBottom}
          >
            <Container
              ref={messageContainerRef}
              maxWidth="md"
              sx={{ padding: 1 }}
            >
              <MessageList />
            </Container>
          </ScrollToBottom>
        </Box>
        <Divider />
        <Container maxWidth="md" sx={{ paddingX: 1 }}>
          <UserInput
            onSend={handleSend}
            onScreenshot={() =>
              screenshot(messageContainerRef.current!, {
                backgroundColor: theme.palette.background.default,
                style: { margin: "0" },
              })
            }
          />
        </Container>
      </Stack>
      {!scrollToBottom && (
        <ScrollToBottomButton onClick={() => setScrollToBottom(true)} />
      )}
      {hasAbortable && <StopButton onClick={() => dispatch(abort())} />}
    </Stack>
  );
}

export default App;
