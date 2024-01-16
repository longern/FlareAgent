import {
  ChatCompletion,
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
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  model: string;
  tools: Tool[];
  onPartialMessage?: (message: ChatCompletionMessage) => void;
}): Promise<WorkflowExecutionState> {
  const node = state.node as AssistantNode;
  const openaiApiKey = localStorage.getItem("OPENAI_API_KEY");
  const baseURL = localStorage.getItem("OPENAI_BASE_URL");
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
  const completion = await openai.chat.completions.create({
    model,
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...state.messages]
      : state.messages,
    tools: tools.length === 0 || !hasToolCallTransition ? undefined : tools,
    stream: true,
  });

  const choices: ChatCompletion.Choice[] = [];
  for await (const chunk of completion) {
    for (const chunkChoice of chunk.choices) {
      const { index, delta, finish_reason } = chunkChoice;
      if (choices.length <= index) choices[index] = {} as ChatCompletion.Choice;
      const choice = choices[index];
      choice.finish_reason = finish_reason;
      choice.message = patchDelta(choice.message, delta);
      onPartialMessage?.(choice.message);
    }
  }

  if (choices.length === 0) {
    throw new Error("No response from OpenAI API");
  }
  const choice = choices[0];

  const nextNode = (() => {
    for (const edge of workflow.edges) {
      if (edge.source !== node.id) continue;
      if (edge.data?.condition?.type === "regex") {
        const regex = new RegExp(edge.data.condition.regex);
        if (regex.test(choice.message.content))
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
  onPartialMessage,
}: {
  workflow: Workflow;
  state: WorkflowExecutionState;
  model: string;
  tools: Tool[];
  onPartialMessage?: (message: ChatCompletionMessage) => void;
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
        onPartialMessage,
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
