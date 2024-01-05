import React, { useCallback } from "react";
import { Button, MenuItem, Select, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { Node, Workflow } from "../workflow";

function WorkflowForm({
  initialWorkflow,
  onWorkflowChange,
}: {
  initialWorkflow: Workflow;
  onWorkflowChange: (workflow: Workflow) => void;
}) {
  const [name, setName] = React.useState<string>(initialWorkflow.name);
  const [nodes, setNodes] = React.useState<Node[]>(initialWorkflow.nodes);

  const { t } = useTranslation();

  // Don't use `updateNode` if updating the node's name
  const updateNode = useCallback(
    (node: Node) => {
      setNodes((nodes) => nodes.map((n) => (n.name === node.name ? node : n)));
    },
    [setNodes]
  );

  return (
    <Stack spacing={2}>
      <TextField
        label="Workflow Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {nodes.map((node) => (
        <>
          <TextField
            label="Node Name"
            value={node.name}
            onChange={(e) => {
              setNodes(
                nodes.map((n) =>
                  n.name === node.name ? { ...n, name: e.target.value } : n
                )
              );
            }}
          />
          {node.type === "user-input" ? (
            <Select
              key={node.name}
              variant="standard"
              value={node.next}
              onChange={(e) => {
                updateNode({ ...node, next: e.target.value });
              }}
              inputProps={{ "aria-label": node.name }}
            >
              {nodes.map((n) => (
                <MenuItem key={n.name} value={n.name}>
                  {n.name}
                </MenuItem>
              ))}
            </Select>
          ) : node.type === "assistant" ? (
            <TextField
              label="System Prompt"
              value={node.prompt}
              multiline
              onChange={(e) => {
                updateNode({ ...node, prompt: e.target.value });
              }}
            />
          ) : node.type === "tool-call" ? (
            <Select
              key={node.name}
              variant="standard"
              value={node.next}
              onChange={(e) => {
                updateNode({ ...node, next: e.target.value });
              }}
              inputProps={{ "aria-label": node.name }}
            >
              {nodes.map((n) => (
                <MenuItem key={n.name} value={n.name}>
                  {n.name}
                </MenuItem>
              ))}
            </Select>
          ) : null}
        </>
      ))}
      <Button
        variant="contained"
        onClick={() => {
          onWorkflowChange({ name, nodes });
        }}
      >
        {t("Save")}
      </Button>
    </Stack>
  );
}

export default WorkflowForm;
