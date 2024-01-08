export interface BaseNode<T = { label: string }> {
  id: string;
  data: T;
}

export interface UserInputNode extends BaseNode {
  type: "user-input";
}

export interface AssistantNode extends BaseNode {
  type: "assistant";
  prompt?: string;
}

export interface ToolCallNode extends BaseNode {
  type: "tool-call";
}

export type Node = UserInputNode | AssistantNode | ToolCallNode;

export type EdgeCondition =
  | {
      toolCall?: boolean;
    }
  | {
      regex?: string;
    };

export interface Edge {
  id: string;
  source: string;
  target: string;
  data?: {
    condition?: EdgeCondition;
  };
}

export interface Workflow {
  name: string;
  nodes: Node[];
  edges: Edge[];
}
