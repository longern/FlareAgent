import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/index.mjs";
import {
  AssistantNode,
  CodeNode,
  Node,
  ToolCallNode,
  UserInputNode,
  Workflow,
} from ".";
import OpenAI from "openai";
import { Tool } from "../tools";

interface WorkflowExecutionState {
  node: Node;
  messages: ChatCompletionMessageParam[] | null;
  variables: Map<string, any>;
}

function findNode(workflow: Workflow, nodeId?: string) {
  return workflow.nodes.find((node) => node.id === nodeId);
}

function findNextNode(workflow: Workflow, node: Node) {
  const edge = workflow.edges.find((edge) => edge.source === node.id);
  const nextNode = findNode(workflow, edge?.target);
  return nextNode;
}

export async function executeUserInputNode({
  workflow,
  state,
  userInput,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  userInput: string;
}): Promise<WorkflowExecutionState> {
  const node = state.node as UserInputNode;
  const nextNode = findNextNode(workflow, node);
  const messages = [
    ...state.messages,
    { role: "user" as const, content: userInput },
  ];
  return {
    node: nextNode,
    messages,
    variables: state.variables,
  };
}

async function executeAssistantNode({
  workflow,
  state,
  model,
  tools: toolsArg,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  model: string;
  tools: Tool[];
}): Promise<WorkflowExecutionState> {
  const node = state.node as AssistantNode;
  const openaiApiKey = localStorage.getItem("openaiApiKey");
  const baseURL = localStorage.getItem("openaiBaseUrl");
  const openai = new OpenAI({
    apiKey: openaiApiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });
  const tools = toolsArg.map((tool) => ({
    ...tool,
    function: tool.function,
  }));

  const hasToolCallTransition = workflow.edges.some(
    (edge) =>
      edge.source === node.id && edge.data?.condition?.type === "tool-call"
  );
  const systemPrompt = node.data.prompt
    ? Object.entries(state.variables).reduce((prompt, [key, value]) => {
        return prompt.replace(`{${key}}`, value);
      }, node.data.prompt)
    : undefined;
  const response = await openai.chat.completions.create({
    model,
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...state.messages]
      : state.messages,
    tools: tools.length === 0 || !hasToolCallTransition ? undefined : tools,
  });
  if (response.choices.length === 0) {
    throw new Error("No response from OpenAI API");
  }

  const choice = response.choices[0];

  const nextNode = (() => {
    for (const edge of workflow.edges) {
      if (edge.source !== node.id) continue;
      if (edge.data?.condition?.type === "regex") {
        if (new RegExp(edge.data.condition.regex).test(choice.message.content))
          return findNode(workflow, edge.target);
      } else if (edge.data?.condition?.type === "tool-call") {
        if (choice.finish_reason === "tool_calls")
          return findNode(workflow, edge.target);
      } else {
        return findNode(workflow, edge.target);
      }
    }
    return findNextNode(workflow, node);
  })();

  return {
    node: nextNode,
    messages: [...state.messages, choice.message],
    variables: state.variables,
  };
}

async function executeToolCallNode({
  workflow,
  state,
  tools,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  tools: Tool[];
}): Promise<WorkflowExecutionState> {
  const node = state.node as ToolCallNode;
  const lastMessage = state.messages[
    state.messages.length - 1
  ] as ChatCompletionMessage;
  const tool_calls = lastMessage.tool_calls;
  const results = (await Promise.allSettled(
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
        const content = await fetch(tool.endpoint, {
          method: tool.method,
          headers: { "Content-Type": "application/json" },
          body: tool_call.function.arguments,
        })
          .then((response) => response.text())
          .catch((e) => {
            return e.message as string;
          });
        return {
          role: "tool",
          tool_call_id: tool_call.id,
          content: content,
        };
      }
    )
  )) as PromiseFulfilledResult<ChatCompletionToolMessageParam>[];

  const newMessages = results.map((result) => result.value);
  return {
    node: findNextNode(workflow, node),
    messages: [...state.messages, ...newMessages],
    variables: state.variables,
  };
}

let flareAgentModule: any = null;

export async function executeCodeNode({
  workflow,
  state,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
}): Promise<WorkflowExecutionState> {
  const node = state.node as CodeNode;
  const { loadPython } = await import("../tools/python");
  const pyodide = await loadPython();
  await pyodide.loadPackagesFromImports(node.data.code);
  if (!flareAgentModule) {
    flareAgentModule = {};
    pyodide.registerJsModule("flareagent", flareAgentModule);
  }
  flareAgentModule.messages = pyodide.toPy(state.messages);
  flareAgentModule.variables = pyodide.toPy(state.variables);

  await new Promise((resolve) => pyodide.FS.syncfs(true, resolve));
  await pyodide.runPythonAsync(node.data.code);
  await new Promise((resolve) => pyodide.FS.syncfs(false, resolve));

  const newVariables = flareAgentModule.variables.toJs();
  return {
    node: findNextNode(workflow, node),
    messages: state.messages,
    variables: newVariables,
  };
}

export async function executeWorkflowStep({
  workflow,
  state,
  model,
  tools,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  model: string;
  tools: Tool[];
}): Promise<WorkflowExecutionState> {
  if (!state.messages) return state;
  switch (state.node.type) {
    case "start":
      return { ...state, node: findNextNode(workflow, state.node) };
    case "assistant":
      return executeAssistantNode({
        workflow,
        state,
        model,
        tools,
      });
    case "tool-call":
      return executeToolCallNode({
        workflow,
        state,
        tools,
      });
    case "code":
      return executeCodeNode({
        workflow,
        state,
      });
    default:
      throw new Error(`Unknown node type: ${state.node.type}`);
  }
}
