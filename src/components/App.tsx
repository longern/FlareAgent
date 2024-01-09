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
import UserInput from "./UserInput";
import { useMessages } from "../messages";
import { Tool, apisToTool } from "../tools";
import { Workflow, defaultWorkflow } from "../workflow";
import WorkflowForm from "./WorkflowForm";
import { useSyncFS } from "../fs/hooks";

const fallbackWorkflows: Workflow[] = [];

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

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [currentWorkflow, setCurrentWorkflow] = useState(defaultWorkflow);
  const [editWorkflow, setEditWorkflow] = useState<Workflow | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState<boolean>(false);
  const [needAssistant, setNeedAssistant] = useState<boolean>(false);
  const [model, setModel] = useState<string>("gpt-3.5-turbo-1106");
  const [scrollToBottom, setScrollToBottom] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<string>(model);

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

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
        setMessages((messages) => [...messages, response.choices[0].message]);

        if (choice.finish_reason === "tool_calls") {
          const tool_calls = choice.message.tool_calls;
          const results = await Promise.allSettled(
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
          results.forEach((result) =>
            setMessages((messages) => [
              ...messages,
              result.status === "fulfilled" ? result.value : result.reason,
            ])
          );
          setNeedAssistant(true);
        }
      }

      return response;
    },
    [setMessages]
  );

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
            setMessages((messages) => [
              ...messages,
              { role: "user", content: userInput },
            ]);
            setNeedAssistant(true);
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
            }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

export default App;
