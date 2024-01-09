import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Container,
  Dialog,
  DialogContent,
  Fab,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Theme,
  useMediaQuery,
} from "@mui/material";
import { ArrowDownward as ArrowDownwardIcon } from "@mui/icons-material";
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

const fallbackWorkflows: Workflow[] = [];

function useCallbackRef<T>(callback: T): React.MutableRefObject<T> {
  const ref = useRef(callback);

  ref.current = callback;

  return ref;
}

function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[] | null>(null);

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
      const startNode = {
        id: "start",
        type: "start" as const,
        data: { label: "Start" },
      };
      setWorkflows([...workflows, { name, nodes: [startNode], edges: [] }]);
      break;
    }
  }, [workflows]);

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

  const executeWorkflowStepEvent = useCallbackRef(
    (workflow: Workflow, node: Node) => {
      return executeWorkflowStep({
        workflow: workflow,
        node: node,
        messages: messages,
        setMessages: setMessages,
        model: model,
        tools: apisToTool(tools),
      });
    }
  );

  useEffect(() => {
    if (currentWorkflow === null) return;
    if (currentNode !== null) return;
    const startNode = currentWorkflow.nodes.find(
      (node) => node.type === "start"
    );
    setCurrentNode(startNode);
  }, [currentWorkflow, currentNode]);

  useEffect(() => {
    if (currentWorkflow === null) return;
    if (!currentNode) return;
    if (currentNode.type === "user-input") return;
    executeWorkflowStepEvent
      .current(currentWorkflow, currentNode)
      .then((nextNode) => {
        setCurrentNode(nextNode);
      });
  }, [currentWorkflow, currentNode, executeWorkflowStepEvent]);

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
        onNewChat={() => setMessages([])}
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
        onWorkflowChange={setCurrentWorkflow}
      />
      {!matchesLg && (
        <MobileToolbar
          modelSelector={ModelSelector}
          onMenuClick={() => setSidebarOpen(true)}
          onCreateThread={() => setMessages([])}
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
        fullWidth
        onClose={() => setWorkflowDialogOpen(false)}
        onTransitionExited={() => setEditWorkflow(null)}
      >
        <DialogContent>
          <WorkflowForm
            workflow={editWorkflow}
            onWorkflowChange={(workflow) => {
              setWorkflows(
                workflows.map((w) => (w.name === workflow.name ? workflow : w))
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
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

export default App;
