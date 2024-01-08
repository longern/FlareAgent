import type { Workflow } from "./types";

export const defaultWorkflow: Workflow = {
  name: "Default",
  nodes: [
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
          toolCall: true,
        },
      },
    },
    {
      id: "e-tool-call-assistant",
      source: "tool-call",
      target: "assistant",
    },
  ],
};
