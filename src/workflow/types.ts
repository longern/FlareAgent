export interface BaseNode<T = { label: string }> {
  id: string;
  data: T;
}

export interface StartNode extends BaseNode {
  type: "start";
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

export type Node = StartNode | UserInputNode | AssistantNode | ToolCallNode;

export type EdgeCondition =
  | {
      type: "tool-call";
    }
  | {
      type: "regex";
      regex: string;
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
