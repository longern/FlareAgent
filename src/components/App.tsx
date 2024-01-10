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
} from "@mui/icons-material";
import type { OpenAPIV3 } from "openapi-types";

import MessageList from "./MessageList";
import MobileToolbar from "./MobileToolbar";
import Sidebar from "./Sidebar";
import ScrollToBottom from "./ScrollToBottom";
import UserInput from "./UserInput";
import { useMessages } from "../messages";
import { apisToTool } from "../tools";
import { Node, Workflow, defaultWorkflow } from "../workflow";
import WorkflowForm from "./WorkflowForm";
import { useSyncFS } from "../fs/hooks";
import {
  executeUserInputNode,
  executeWorkflowStep,
} from "../workflow/execution";
import { useTranslation } from "react-i18next";

const fallbackWorkflows: Workflow[] = [];

function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[] | null>(null);
  const { t } = useTranslation();

  useSyncFS({
    path: "/root/.flareagent/workflows.json",
    value: workflows,
    setValue: setWorkflows,
    fallbackValue: fallbackWorkflows,
  });

  const newWorkflow = useCallback(() => {
    if (workflows === null) return;
    for (let i = 0; i < 1000; i++) {
      const name = `Workflow ${i + 1}`;
      if (workflows.find((workflow) => workflow.name === name)) {
        continue;
      }
      const workflow: Workflow = {
        name,
        nodes: [
          { id: "start", type: "start", data: { label: t("Start") } },
          {
            id: "user-input",
            type: "user-input",
            data: { label: t("User Input") },
          },
          {
            id: "assistant",
            type: "assistant",
            data: { label: t("LLM") },
          },
        ],
        edges: [
          {
            id: "e-start-user-input",
            source: "start",
            target: "user-input",
          },
          {
            id: "e-user-input-assistant",
            source: "user-input",
            target: "assistant",
          },
          {
            id: "e-assistant-user-input",
            source: "assistant",
            target: "user-input",
          },
        ],
      };
      setWorkflows([...workflows, workflow]);
      break;
    }
  }, [workflows, t]);

  return [workflows, setWorkflows, newWorkflow] as const;
}

function useTools() {
  const [tools, setTools] = useState<OpenAPIV3.Document[]>([]);

  const fetchTools = useCallback(async () => {
    await import("../tools");
    const response = await fetch("tool://");
    const data: { tools: string[] } = await response.json();
    const toolsResult = await Promise.allSettled(
      data.tools.map(async (url) => {
        const response = await fetch(url);
        const tool: OpenAPIV3.Document = await response.json();
        return tool;
      })
    );
    const tools = toolsResult
      .map((result) => {
        return result.status === "fulfilled" ? result.value : null;
      })
      .filter((tool) => tool !== null);
    setTools(tools);
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return tools;
}

function App() {
  const tools = useTools();
  const [workflows, setWorkflows, newWorkflow] = useWorkflows();
  const [messages, setMessages] = useMessages();
  const [currentWorkflow, setCurrentWorkflow] = useState(defaultWorkflow);
  const [currentNode, setCurrentNode] = useState<Node | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [editWorkflow, setEditWorkflow] = useState<Workflow | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState<boolean>(false);
  const [model, setModel] = useState<string>("gpt-3.5-turbo-1106");
  const [scrollToBottom, setScrollToBottom] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  const executeWorkflowStepCallback = (workflow: Workflow, node: Node) => {
    return executeWorkflowStep({
      workflow: workflow,
      node: node,
      messages: messages,
      setMessages: setMessages,
      model: model,
      tools: apisToTool(tools),
    });
  };
  const executeWorkflowStepRef = useRef(executeWorkflowStepCallback);
  executeWorkflowStepRef.current = executeWorkflowStepCallback;

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentNode(null);
    setSidebarOpen(false);
  }, [setMessages]);

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
      .then((nextNode) => {
        setCurrentNode(nextNode);
      });
  }, [currentWorkflow, currentNode]);

  const workflowsWithDefault = useMemo(
    () => (workflows === null ? null : [defaultWorkflow, ...workflows]),
    [workflows]
  );

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
        onNewChat={handleNewChat}
        modelSelector={matchesLg ? ModelSelector : undefined}
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
          modelSelector={ModelSelector}
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
          <Container maxWidth="md" sx={{ padding: 1 }}>
            <MessageList messages={messages} />
          </Container>
        </ScrollToBottom>
      </Box>
      <Container maxWidth="md">
        <UserInput
          onSend={(userInput) => {
            executeUserInputNode({
              workflow: currentWorkflow,
              node: currentNode,
              setMessages: setMessages,
              userInput: userInput,
            }).then((nextNode) => {
              setCurrentNode(nextNode);
            });
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
            workflow={editWorkflow}
            onWorkflowChange={(workflow) => {
              setWorkflows(
                workflows.map((w) => (w === editWorkflow ? workflow : w))
              );
              setWorkflowDialogOpen(false);
            }}
            onWorkflowDelete={() => {
              setWorkflows(
                workflows.filter((w) => w.name !== editWorkflow.name)
              );
              setWorkflowDialogOpen(false);
              if (currentWorkflow.name === editWorkflow.name) {
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
