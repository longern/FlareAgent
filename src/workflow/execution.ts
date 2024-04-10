import OpenAI from "openai";
import {
  ChatCompletion,
  ChatCompletionContentPart,
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/index";

import {
  AssistantNode,
  CodeNode,
  DecisionNode,
  Node,
  ToolCallNode,
  UserInputNode,
  Workflow,
} from "./types";
import { Tool } from "../tools";

interface WorkflowExecutionState {
  node: Node | undefined;
  messages: ChatCompletionMessageParam[];
  variables: Map<string, string>;
}

function findNode(workflow: Workflow, nodeId?: string) {
  return workflow.nodes.find((node) => node.id === nodeId);
}

function findNextNode(workflow: Workflow, node: Node) {
  const edge = workflow.edges.find((edge) => edge.source === node.id);
  const nextNode = findNode(workflow, edge?.target);
  return nextNode;
}

export async function executeDecisionNode({
  workflow,
  state,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
}) {
  const node = state.node as DecisionNode;
  const lastMessage = state.messages[state.messages.length - 1];
  const isTrue = (() => {
    switch (node.data.condition?.type) {
      case "regex":
        if (lastMessage.role !== "assistant") return false;
        const regex = new RegExp(node.data.condition.regex);
        return regex.test(lastMessage.content ?? "");
      case "tool-call":
        if (lastMessage.role !== "assistant") return false;
        return lastMessage.tool_calls?.length > 0;
      case "variable":
        const variable = state.variables.get(node.data.condition.variable);
        if (variable === undefined) return false;
        const rhs = node.data.condition.rhs;
        switch (node.data.condition.operator) {
          case "eq":
            return variable === rhs;
          case "neq":
            return variable !== rhs;
          case "lt":
            return Number(variable) < Number(rhs);
          case "lte":
            return Number(variable) <= Number(rhs);
          case "gt":
            return Number(variable) > Number(rhs);
          case "gte":
            return Number(variable) >= Number(rhs);
          default:
            throw new Error(
              `Unknown operator: ${node.data.condition.operator}`
            );
        }
      default:
        throw new Error(`Unknown decision: ${node.data.condition}`);
    }
  })();

  const nextNode = (() => {
    for (const edge of workflow.edges) {
      if (edge.source !== node.id) continue;
      if (isTrue === Boolean(edge.data?.condition)) {
        return findNode(workflow, edge.target);
      }
    }
    return undefined;
  })();

  return {
    node: nextNode,
    messages: state.messages,
    variables: state.variables,
  };
}

export async function executeUserInputNode({
  workflow,
  state,
  userInput,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  userInput: string | ChatCompletionContentPart[];
}): Promise<WorkflowExecutionState> {
  const node = state.node as UserInputNode;
  const nextNode = findNextNode(workflow, node);
  return {
    node: nextNode,
    messages: [...state.messages, { role: "user", content: userInput }],
    variables: state.variables,
  };
}

function patchDelta(obj: any, delta: any) {
  if (Array.isArray(delta)) {
    const newObj = obj ? [...obj] : [];
    delta.forEach((item: { index: number; [key: string]: any }) => {
      newObj[item.index] = patchDelta(newObj[item.index], item);
    });
    return newObj;
  } else if (delta === null) {
    return null;
  } else if (typeof delta === "object") {
    const newObj = obj ? { ...obj } : {};
    for (const key in delta) {
      newObj[key] = patchDelta(newObj[key], delta[key]);
    }
    return newObj;
  } else if (typeof delta === "string") {
    return (obj ?? "") + delta;
  }
  return delta;
}

async function executeAssistantNode({
  workflow,
  state,
  model,
  tools: toolsArg,
  onPartialMessage,
  onAbortController,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  model: string;
  tools: Tool[];
  onPartialMessage?: (message: ChatCompletionMessage) => void;
  onAbortController?: (controller: AbortController | undefined) => void;
}): Promise<WorkflowExecutionState> {
  const node = state.node as AssistantNode;
  const openaiApiKey = localStorage.getItem("OPENAI_API_KEY") ?? "";
  const baseURL = localStorage.getItem("OPENAI_BASE_URL");
  const openai = new OpenAI({
    apiKey: openaiApiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });
  const tools = toolsArg
    .map(({ type, function: func }) => ({ type, function: func }))
    .filter((tool) => node.data.tools?.includes(tool.function.name) ?? false);

  const systemPrompt = node.data.prompt?.replace(
    /{([A-Za-z0-9_]+)}/g,
    (match, variableName) => state.variables.get(variableName) ?? match
  );
  const completion = await openai.chat.completions.create({
    model,
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...state.messages]
      : state.messages,
    // Hardcode tools to undefined for gpt-4-vision-preview
    tools:
      tools.length === 0 || model === "gpt-4-vision-preview"
        ? undefined
        : tools,
    stream: true,
    // Hardcode max_tokens for gpt-4-vision-preview
    max_tokens: model === "gpt-4-vision-preview" ? 4096 : undefined,
  });
  onAbortController?.(completion.controller);

  const choices: ChatCompletion.Choice[] = [];
  for await (const chunk of completion) {
    for (const chunkChoice of chunk.choices) {
      const { index, delta, finish_reason } = chunkChoice;
      if (choices.length <= index) choices[index] = {} as ChatCompletion.Choice;
      const choice = choices[index];
      choice.finish_reason = finish_reason!;
      choice.message = patchDelta(choice.message, delta);
      if (!node.data.pipeToVariable) onPartialMessage?.(choice.message);
    }
  }
  onAbortController?.(undefined);

  if (choices.length === 0) {
    throw new Error("No response from OpenAI API");
  }
  const choice = choices[0];

  return !node.data.pipeToVariable
    ? {
        node: findNextNode(workflow, node),
        messages: [...state.messages, choice.message],
        variables: state.variables,
      }
    : {
        node: findNextNode(workflow, node),
        messages: state.messages,
        variables: state.variables.set(
          node.data.pipeToVariable,
          choice.message.content
        ),
      };
}

async function executeToolCallNode({
  workflow,
  state,
  tools,
  onAbortController,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  tools: Tool[];
  onAbortController?: (controller: AbortController | undefined) => void;
}): Promise<WorkflowExecutionState> {
  const node = state.node as ToolCallNode;
  const lastMessage = state.messages[
    state.messages.length - 1
  ] as ChatCompletionMessage;
  const tool_calls = lastMessage.tool_calls!;
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
        const controller = new AbortController();
        onAbortController?.(controller);
        const content = await fetch(tool.endpoint, {
          method: tool.method,
          headers: { "Content-Type": "application/json" },
          body: tool_call.function.arguments,
          signal: controller.signal,
        })
          .then((response) => response.text())
          .catch((e) => {
            return e.message as string;
          })
          .finally(() => {
            onAbortController?.(undefined);
          });
        return {
          role: "tool",
          tool_call_id: tool_call.id,
          content: content.slice(content.length - 4096),
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

export async function executeCodeNode({
  workflow,
  state,
  onAbortController,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  onAbortController?: (controller: AbortController | undefined) => void;
}): Promise<WorkflowExecutionState> {
  const node = state.node as CodeNode;
  const controller = new AbortController();
  onAbortController?.(controller);
  const env = new Map(state.variables);
  env.set("MESSAGES", JSON.stringify(state.messages));
  const { runPython } = await import("../python");
  const { variables } = await runPython(node.data.code!, {
    env,
    signal: controller.signal,
  }).finally(() => {
    onAbortController?.(undefined);
  });
  variables.delete("MESSAGES");

  return {
    node: findNextNode(workflow, node),
    messages: state.messages,
    variables,
  };
}

export async function executeWorkflowStep({
  workflow,
  state,
  model,
  tools,
  onPartialMessage,
  onAbortController,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  model: string;
  tools: Tool[];
  onPartialMessage?: (message: ChatCompletionMessage) => void;
  onAbortController?: (controller: AbortController | undefined) => void;
}): Promise<WorkflowExecutionState> {
  if (!state.messages) return state;
  if (!state.node) return state;
  switch (state.node.type) {
    case "start":
      return { ...state, node: findNextNode(workflow, state.node) };
    case "decision":
      return executeDecisionNode({ workflow, state });
    case "assistant":
      return executeAssistantNode({
        workflow,
        state,
        model,
        tools,
        onPartialMessage,
        onAbortController,
      });
    case "tool-call":
      return executeToolCallNode({
        workflow,
        state,
        tools,
        onAbortController,
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
