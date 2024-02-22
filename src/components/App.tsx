import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  MenuItem,
  Select,
  Stack,
  Theme,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { ScrollToBottomButton, StopButton } from "./ActionButtons";
import MessageList from "./MessageList";
import MobileToolbar from "./MobileToolbar";
import Sidebar from "./Sidebar";
import ScrollToBottom from "./ScrollToBottom";
import UserInput from "./UserInput";
import { useMessages } from "../messages";
import { apisToTool } from "../tools";
import { Node, Workflow, defaultWorkflow } from "../workflow";
import {
  executeUserInputNode,
  executeWorkflowStep,
} from "../workflow/execution";
import { useModels } from "./hooks";
import { useSetError } from "./ErrorDisplay";
import { useActionsState, useSettings } from "./ActionsProvider";

function ModelSelector({
  model,
  onModelChange,
}: {
  model: string;
  onModelChange: (model: string) => void;
}) {
  const models = useModels();

  return (
    <Select
      variant="standard"
      value={model}
      onChange={(e) => {
        onModelChange(e.target.value);
      }}
      inputProps={{ "aria-label": "model" }}
    >
      {models ? (
        models.map((model) => (
          <MenuItem key={model} value={model}>
            {model}
          </MenuItem>
        ))
      ) : (
        <MenuItem value={model}>{model}</MenuItem>
      )}
    </Select>
  );
}

function useModel() {
  const [model, setModel] = useState(
    localStorage.getItem("OPENAI_MODEL") ?? "gpt-3.5-turbo"
  );

  useEffect(() => {
    localStorage.setItem("OPENAI_MODEL", model);
  }, [model]);

  return [model, setModel] as const;
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
  const setError = useSetError();
  const settings = useSettings();

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const theme = useTheme();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const executeWorkflowStepCallback = async (
    workflow: Workflow,
    node: Node
  ) => {
    variables.set("MEMORIES", "");
    if (!settings.disableMemory) {
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
        tools.filter(
          (tool) => !settings.disableMemory || tool.info.title !== "Memory"
        )
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
  }, [setMessages, controller]);

  const handleWorkflowChange = useCallback(
    (workflow: Workflow) => {
      setCurrentWorkflow(workflow);
      handleNewChat();
    },
    [handleNewChat]
  );

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
        setError(e.message);
      });
  }, [currentWorkflow, currentNode, setError, setMessages]);

  return (
    <Stack height="100%">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        modelSelector={
          matchesLg ? (
            <ModelSelector model={model} onModelChange={setModel} />
          ) : undefined
        }
        currentWorkflow={currentWorkflow}
        onWorkflowChange={handleWorkflowChange}
      />
      {!matchesLg && (
        <MobileToolbar
          modelSelector={
            <ModelSelector model={model} onModelChange={setModel} />
          }
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
            <MessageList messages={messages} />
          </Container>
        </ScrollToBottom>
      </Box>
      <Container maxWidth="md" sx={{ paddingX: 1 }}>
        <UserInput
          onSend={(userInput) => {
            executeUserInputNode({
              workflow: currentWorkflow,
              state: {
                node: currentNode!,
                messages: messages!,
                variables: variables,
              },
              userInput: userInput,
            }).then((state) => {
              setCurrentNode(state.node);
              setMessages(state.messages);
            });
          }}
          onScreenshot={async () => {
            const { toBlob } = await import("html-to-image");
            const blob = await toBlob(messageContainerRef.current!, {
              backgroundColor: theme.palette.background.default,
              style: { margin: "0" },
            });
            const clipboardItem = new ClipboardItem({ [blob.type]: blob });
            navigator.clipboard.write([clipboardItem]);
          }}
        />
      </Container>
      {!scrollToBottom && (
        <ScrollToBottomButton onClick={() => setScrollToBottom(true)} />
      )}
      {controller && <StopButton onClick={() => controller.abort()} />}
    </Stack>
  );
}

export default App;
