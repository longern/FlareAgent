import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppBar,
  Box,
  Container,
  Dialog,
  DialogContent,
  Fab,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Theme,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowDownward as ArrowDownwardIcon,
  Close as CloseIcon,
  Stop as StopIcon,
} from "@mui/icons-material";

import MessageList from "./MessageList";
import MobileToolbar from "./MobileToolbar";
import Sidebar from "./Sidebar";
import ScrollToBottom from "./ScrollToBottom";
import UserInput from "./UserInput";
import { useMessages } from "../messages";
import { apisToTool } from "../tools";
import { Node, Workflow, defaultWorkflow } from "../workflow";
import WorkflowForm from "./WorkflowForm";
import {
  executeUserInputNode,
  executeWorkflowStep,
} from "../workflow/execution";
import { useModels, useTools, useWorkflows } from "./hooks";

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

function App() {
  const tools = useTools();
  const [workflows, setWorkflows, newWorkflow] = useWorkflows();
  const [currentWorkflow, setCurrentWorkflow] = useState(defaultWorkflow);
  const [messages, setMessages] = useMessages();
  const [currentNode, setCurrentNode] = useState<Node | undefined | null>(null);
  const [variables, setVariables] = useState<Map<string, string>>(new Map());
  const [controller, setController] = useState<AbortController | undefined>(
    undefined
  );

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [editWorkflow, setEditWorkflow] = useState<Workflow | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState<boolean>(false);
  const [model, setModel] = useState<string>("gpt-3.5-turbo-1106");
  const [scrollToBottom, setScrollToBottom] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const executeWorkflowStepCallback = async (
    workflow: Workflow,
    node: Node
  ) => {
    const state = await executeWorkflowStep({
      workflow: workflow,
      state: {
        node: node,
        messages: messages!,
        variables: variables,
      },
      model: model,
      tools: apisToTool(tools),
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
  }, [currentWorkflow, currentNode, setMessages]);

  const workflowsWithDefault = useMemo(
    () => (workflows === null ? null : [defaultWorkflow, ...workflows]),
    [workflows]
  );

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
        tools={tools}
        workflows={workflowsWithDefault}
        onNewWorkflow={newWorkflow}
        onEditWorkflow={(workflow) => {
          if (workflow === defaultWorkflow) return;
          setEditWorkflow(workflow);
          setWorkflowDialogOpen(true);
        }}
        currentWorkflow={currentWorkflow}
        onWorkflowChange={(workflow) => {
          setCurrentWorkflow(workflow);
          handleNewChat();
        }}
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
              style: { margin: "0" },
            });
            const clipboardItem = new ClipboardItem({ [blob.type]: blob });
            navigator.clipboard.write([clipboardItem]);
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
      {controller && (
        <Fab
          size="small"
          sx={{
            position: "absolute",
            bottom: 64,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
          }}
          onClick={() => {
            controller.abort();
          }}
        >
          <StopIcon />
        </Fab>
      )}
      <Dialog
        open={workflowDialogOpen}
        fullScreen
        onClose={() => setWorkflowDialogOpen(false)}
        onTransitionExited={() => setEditWorkflow(null)}
      >
        <AppBar position="relative">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setWorkflowDialogOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
              {editWorkflow?.name}
            </Typography>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <WorkflowForm
            workflow={editWorkflow!}
            onWorkflowChange={(workflow) => {
              setWorkflows(
                workflows!.map((w) => (w === editWorkflow ? workflow : w))
              );
              setWorkflowDialogOpen(false);
              if (currentWorkflow === editWorkflow) {
                setCurrentWorkflow(workflow);
                handleNewChat();
              }
            }}
            onWorkflowDelete={() => {
              setWorkflows(
                workflows!.filter((w) => w.name !== editWorkflow!.name)
              );
              setWorkflowDialogOpen(false);
              if (currentWorkflow.name === editWorkflow!.name) {
                setCurrentWorkflow(defaultWorkflow);
                handleNewChat();
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

export default App;
