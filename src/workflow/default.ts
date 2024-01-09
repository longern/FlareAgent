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
        label: "Assistant",
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
      id: "e-assistant-tool-call",
      source: "assistant",
      target: "tool-call",
      data: {
        condition: {
          type: "tool-call",
        },
      },
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
