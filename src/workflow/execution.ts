import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/index.mjs";
import { AssistantNode, CodeNode, Node, ToolCallNode, Workflow } from ".";
import React from "react";
import OpenAI from "openai";
import { Tool } from "../tools";

function findNextNode(workflow: Workflow, node: Node) {
  const edge = workflow.edges.find((edge) => edge.source === node.id);
  const nextNode = workflow.nodes.find((node) => node.id === edge?.target);
  return nextNode;
}

export async function executeUserInputNode({
  node,
  workflow,
  setMessages,
  userInput,
}: {
  node: Node;
  workflow: Workflow;
  setMessages: React.Dispatch<
    React.SetStateAction<ChatCompletionMessageParam[] | null>
  >;
  userInput: string;
}) {
  setMessages((messages) => [
    ...messages,
    {
      role: "user",
      content: userInput,
    },
  ]);
  return findNextNode(workflow, node);
}

async function executeAssistantNode({
  node,
  workflow,
  messages,
  setMessages,
  model,
  tools: toolsArg,
}: {
  node: AssistantNode;
  workflow: Workflow;
  messages: ChatCompletionMessageParam[] | null;
  setMessages: React.Dispatch<
    React.SetStateAction<ChatCompletionMessageParam[] | null>
  >;
  model: string;
  tools: Tool[];
}) {
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
  const response = await openai.chat.completions.create({
    model,
    messages: node.data.prompt
      ? [...messages, { role: "system", content: node.data.prompt }]
      : messages,
    tools: tools.length === 0 || !hasToolCallTransition ? undefined : tools,
  });
  if (response.choices.length > 0) {
    const choice = response.choices[0];

    setMessages((messages) => [...messages, choice.message]);

    for (const edge of workflow.edges) {
      if (edge.source !== node.id) continue;
      if (edge.data?.condition?.type === "regex") {
        const regex = new RegExp(edge.data.condition.regex);
        if (regex.test(choice.message.content)) {
          const nextNode = workflow.nodes.find(
            (node) => node.id === edge.target
          );
          return nextNode;
        }
      } else if (edge.data?.condition?.type === "tool-call") {
        if (choice.finish_reason === "tool_calls") {
          const nextNode = workflow.nodes.find(
            (node) => node.id === edge.target
          );
          return nextNode;
        }
      } else {
        const nextNode = workflow.nodes.find((node) => node.id === edge.target);
        return nextNode;
      }
    }
  }
  return findNextNode(workflow, node);
}

async function executeToolCallNode({
  node,
  workflow,
  messages,
  setMessages,
  tools,
}: {
  node: ToolCallNode;
  workflow: Workflow;
  messages: ChatCompletionMessageParam[] | null;
  setMessages: React.Dispatch<
    React.SetStateAction<ChatCompletionMessageParam[] | null>
  >;
  tools: Tool[];
}) {
  const lastMessage = messages[messages.length - 1] as ChatCompletionMessage;
  const tool_calls = lastMessage.tool_calls;
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
  return findNextNode(workflow, node);
}

export async function executeCodeNode({
  node,
  workflow,
}: {
  node: CodeNode;
  workflow: Workflow;
}) {
  const { loadPython } = await import("../tools/python");
  const pyodide = await loadPython();
  await pyodide.loadPackagesFromImports(node.data.code);
  await new Promise((resolve) => pyodide.FS.syncfs(true, resolve));
  await pyodide.runPythonAsync(node.data.code);
  await new Promise((resolve) => pyodide.FS.syncfs(false, resolve));
  return findNextNode(workflow, node);
}

export async function executeWorkflowStep({
  workflow,
  node,
  messages,
  setMessages,
  model,
  tools,
}: {
  workflow: Workflow;
  node: Node;
  messages: ChatCompletionMessageParam[] | null;
  setMessages: React.Dispatch<
    React.SetStateAction<ChatCompletionMessageParam[] | null>
  >;
  model: string;
  tools: Tool[];
}): Promise<Node> {
  if (!messages) return node;
  switch (node.type) {
    case "start":
      return findNextNode(workflow, node);
    case "assistant":
      return executeAssistantNode({
        node,
        workflow,
        messages,
        setMessages,
        model,
        tools,
      });
    case "tool-call":
      return executeToolCallNode({
        node,
        workflow,
        messages,
        setMessages,
        tools,
      });
    case "code":
      return executeCodeNode({
        node,
        workflow,
      });
    default:
      throw new Error(`Unknown node type: ${(node as Node).type}`);
  }
}
