export interface BaseNode<T = { label: string }> {
  id: string;
  data: T;
}

export interface StartNode extends BaseNode {
  type: "start";
}

export interface DecisionNode
  extends BaseNode<{
    label: string;
    condition?: EdgeCondition;
  }> {
  type: "decision";
}

export interface UserInputNode extends BaseNode {
  type: "user-input";
}

export interface AssistantNode
  extends BaseNode<{
    label: string;
    prompt?: string;
    pipeToVariable?: string;
    tools?: string[];
  }> {
  type: "assistant";
}

export interface ToolCallNode extends BaseNode {
  type: "tool-call";
}

export interface CodeNode
  extends BaseNode<{
    label: string;
    code?: string;
  }> {
  type: "code";
}

export type Node =
  | StartNode
  | DecisionNode
  | UserInputNode
  | AssistantNode
  | ToolCallNode
  | CodeNode;

export type EdgeCondition =
  | {
      type: "tool-call";
    }
  | {
      type: "regex";
      regex: string;
    }
  | {
      type: "variable";
      variable: string;
      operator: "eq" | "neq" | "lt" | "lte" | "gt" | "gte";
      rhs: string;
    };

export interface Edge {
  id: string;
  source: string;
  target: string;
  data?: {
    condition?: boolean;
  };
}

export interface Workflow {
  name: string;
  nodes: Node[];
  edges: Edge[];
}
