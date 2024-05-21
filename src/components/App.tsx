import {
  Container,
  Divider,
  Stack,
  Theme,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { Options as HtmlToImageOptions } from "html-to-image/lib/types";
import type { ChatCompletionContentPart } from "openai/resources/index.mjs";
import React, { useCallback, useRef, useState } from "react";

import { abort, setAbortable } from "../app/abort";
import {
  createConversation,
  createMessage,
  fetchAssistantMessage,
  fetchDrawings,
  setCurrentConversation,
} from "../app/conversations";
import { showError } from "../app/error";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { Workflow, defaultWorkflow } from "../workflow";
import WorkflowsDialog from "./global/WorkflowsDialog";
import Main from "./main/Main";
import UserInput from "./main/UserInput";
import MobileToolbar from "./sidebar/MobileToolbar";
import Sidebar from "./sidebar/Sidebar";

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
      <Stack sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
        {!matchesLg && (
          <MobileToolbar
            onMenuClick={() => setSidebarOpen(true)}
            onCreateThread={handleNewChat}
          />
        )}
        <Main messageContainerRef={messageContainerRef} />
        <Divider />
        <Container component="footer" maxWidth="md" sx={{ paddingX: 1 }}>
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
      <WorkflowsDialog
        currentWorkflow={currentWorkflow}
        onWorkflowChange={handleWorkflowChange}
      />
    </Stack>
  );
}

export default App;
