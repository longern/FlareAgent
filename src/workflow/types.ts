export interface UserInputNode {
  type: "user-input";
  name: string;
  next?: string;
}

export interface AssistantNode {
  type: "assistant";
  name: string;
  prompt?: string;
  edges: [
    {
      condition: string;
      next: string;
    }
  ];
  toolCallNext?: string;
}

export interface ToolCallNode {
  type: "tool-call";
  name: string;
  next?: string;
}

export type Node = UserInputNode | AssistantNode | ToolCallNode;

export interface Workflow {
  name: string;
  nodes: Node[];
}
