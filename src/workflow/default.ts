import type { Workflow } from "./types";

export const defaultWorkflow: Workflow = {
  name: "Default",
  nodes: [
    {
      id: "start",
      type: "start",
      data: {
        label: "Start",
      },
    },
    {
      id: "user-input",
      type: "user-input",
      data: {
        label: "User Input",
      },
    },
    {
      id: "assistant",
      type: "assistant",
      data: {
        prompt: "{MEMORIES}",
        label: "Assistant",
        tools: ["setMemory", "deleteMemory", "search", "crawl", "python"],
      },
    },
    {
      id: "decision",
      type: "decision",
      data: {
        label: "Decision",
        condition: {
          type: "tool-call",
        },
      },
    },
    {
      id: "tool-call",
      type: "tool-call",
      data: {
        label: "Tool Call",
      },
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
      id: "e-assistant-decision",
      source: "assistant",
      target: "decision",
    },
    {
      id: "e-decision-tool-call",
      source: "decision",
      target: "tool-call",
      data: {
        condition: true,
      },
    },
    {
      id: "e-decision-user-input",
      source: "decision",
      target: "user-input",
    },
    {
      id: "e-assistant-user-input",
      source: "assistant",
      target: "user-input",
    },
    {
      id: "e-tool-call-assistant",
      source: "tool-call",
      target: "assistant",
    },
  ],
};
