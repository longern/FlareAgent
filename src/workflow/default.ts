import type { Workflow } from "./types";

export const defaultWorkflow: Workflow = {
  name: "Default",
  nodes: [
    {
      type: "user-input",
      name: "User Input",
      next: "Assistant",
    },
    {
      type: "assistant",
      name: "Assistant",
      edges: [
        {
          condition: "*",
          next: "User Input",
        },
      ],
      toolCallNext: "Tool Call",
    },
    {
      type: "tool-call",
      name: "Tool Call",
      next: "Assistant",
    },
  ],
};
