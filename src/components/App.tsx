import React, { useCallback, useEffect, useRef, useState } from "react";
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
import Sidebar, { ModelSelector, useModel } from "./sidebar/Sidebar";
import ScrollToBottom from "./main/ScrollToBottom";
import UserInput from "./main/UserInput";
import { useMessages } from "../messages";
import { apisToTool } from "../tools";
import { Node, Workflow, defaultWorkflow } from "../workflow";
import { executeWorkflowStep } from "../workflow/execution";
import { useActionsState } from "./ActionsProvider";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { showError } from "../app/error";
import {
  createConversation,
  createMessage,
  fetchAssistantMessage,
  setCurrentConversation,
} from "../app/conversations";

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
  const dispatch = useAppDispatch();
  const [model] = useModel();
  const currentConversationId = useAppSelector(
    (state) => state.conversations.currentConversationId
  );

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
      dispatch(fetchAssistantMessage(model));
    },
    [dispatch, currentConversationId, model]
  );
}

function App() {
  const [tools] = useActionsState();
  const [currentWorkflow, setCurrentWorkflow] = useState(defaultWorkflow);
  const [messages, setMessages] = useMessages();
  const [currentNode, setCurrentNode] = useState<Node | undefined | null>(null);
  const [variables, setVariables] = useState<Map<string, string>>(new Map());
  const [controller, setController] = useState<AbortController | undefined>(
    undefined
  );

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [model, setModel] = useModel();
  const [scrollToBottom, setScrollToBottom] = useState<boolean>(true);
  const disableMemory = useAppSelector((state) => state.settings.disableMemory);
  const dispatch = useAppDispatch();

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const theme = useTheme();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const executeWorkflowStepCallback = async (
    workflow: Workflow,
    node: Node
  ) => {
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

    const state = await executeWorkflowStep({
      workflow: workflow,
      state: {
        node: node,
        messages: messages!,
        variables: variables,
      },
      model: model,
      tools: apisToTool(
        tools.filter((tool) => !disableMemory || tool.info.title !== "Memory")
      ),
      onPartialMessage: (message) => setMessages([...messages!, message]),
      onAbortController: (controller) => setController(controller),
    });
    setVariables(state.variables);
    return state;
  };
  const executeWorkflowStepRef = useRef(executeWorkflowStepCallback);
  executeWorkflowStepRef.current = executeWorkflowStepCallback;

  const handleNewChat = useCallback(() => {
    setCurrentNode(null);
    setMessages([]);
    setVariables(new Map());
    setSidebarOpen(false);
    if (controller) {
      controller.abort();
      setController(undefined);
    }
    dispatch(setCurrentConversation(null));
  }, [dispatch, setMessages, controller]);

  const handleWorkflowChange = useCallback(
    (workflow: Workflow) => {
      setCurrentWorkflow(workflow);
      handleNewChat();
    },
    [handleNewChat]
  );

  const handleSend = useHandleSend();

  useEffect(() => {
    if (currentWorkflow === null || messages === null) return;
    if (currentNode !== null) return;
    const startNode = currentWorkflow.nodes.find(
      (node) => node.type === "start"
    );
    setCurrentNode(startNode);
  }, [currentWorkflow, currentNode, messages]);

  useEffect(() => {
    if (currentWorkflow === null) return;
    if (!currentNode) return;
    if (currentNode.type === "user-input") return;
    executeWorkflowStepRef
      .current(currentWorkflow, currentNode)
      .then((state) => {
        setCurrentNode(state.node);
        setMessages(state.messages);
      })
      .catch((e) => {
        dispatch(showError({ message: e.message }));
      });
  }, [currentWorkflow, currentNode, dispatch, setMessages]);

  const modelSelector = (
    <ModelSelector model={model} onModelChange={setModel} />
  );

  return (
    <Stack direction="row" height="100%">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        modelSelector={modelSelector}
        currentWorkflow={currentWorkflow}
        onWorkflowChange={handleWorkflowChange}
      />
      <Stack minWidth={0} flexGrow={1}>
        {!matchesLg && (
          <MobileToolbar
            modelSelector={modelSelector}
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
      {controller && <StopButton onClick={() => controller.abort()} />}
    </Stack>
  );
}

export default App;
