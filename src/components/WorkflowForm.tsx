import React, { Fragment, useCallback } from "react";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import type { Node, Workflow } from "../workflow";

function WorkflowForm({
  workflow,
  onWorkflowChange,
}: {
  workflow: Workflow;
  onWorkflowChange: (workflow: Workflow) => void;
}) {
  const [name, setName] = React.useState<string>(workflow.name);
  const [nodes, setNodes] = React.useState<Node[]>(workflow.nodes);

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
        label={t("Workflow Name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {nodes.map((node) => (
        <Fragment key={node.name}>
          <TextField
            label={t("Node Name")}
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
            <FormControl>
              <InputLabel id="next-node-label">{t("Next Node")}</InputLabel>
              <Select
                key={node.name}
                label={t("Next Node")}
                labelId="next-node-label"
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
            </FormControl>
          ) : node.type === "assistant" ? (
            <TextField
              key={node.name}
              label={t("System Prompt")}
              value={node.prompt}
              multiline
              rows={8}
              onChange={(e) => {
                updateNode({ ...node, prompt: e.target.value });
              }}
            />
          ) : node.type === "tool-call" ? (
            <FormControl>
              <InputLabel id="next-node-label">{t("Next Node")}</InputLabel>
              <Select
                key={node.name}
                label={t("Next Node")}
                labelId="next-node-label"
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
            </FormControl>
          ) : null}
        </Fragment>
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
