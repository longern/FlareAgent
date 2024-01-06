import React, { useCallback } from "react";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import type { Node, Workflow } from "../workflow";

function NodeForm({
  node,
  nodes,
  onUpdateNode,
  onRenameNode,
}: {
  node: Node;
  nodes: Node[];
  onUpdateNode: (node: Node) => void;
  onRenameNode: (node: Node, newName: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack spacing={2} sx={{ py: 2 }}>
      <TextField
        label={t("Node Name")}
        value={node.name}
        onChange={(e) => onRenameNode(node, e.target.value)}
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
              onUpdateNode({ ...node, next: e.target.value });
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
            onUpdateNode({ ...node, prompt: e.target.value });
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
              onUpdateNode({ ...node, next: e.target.value });
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
    </Stack>
  );
}

function WorkflowForm({
  workflow,
  onWorkflowChange,
  onWorkflowDelete,
}: {
  workflow: Workflow;
  onWorkflowChange: (workflow: Workflow) => void;
  onWorkflowDelete: () => void;
}) {
  const [name, setName] = React.useState<string>(workflow.name);
  const [nodes, setNodes] = React.useState<Node[]>(workflow.nodes);
  const [editingNode, setEditingNode] = React.useState<Node | undefined>(
    nodes[0]
  );

  const { t } = useTranslation();

  // Don't use `updateNode` if updating the node's name
  const updateNode = useCallback((node: Node) => {
    setNodes((nodes) => nodes.map((n) => (n.name === node.name ? node : n)));
    setEditingNode(node);
  }, []);

  const renameNode = useCallback(
    (node: Node, newName: string) => {
      const newNodes = nodes.map((n) =>
        n.name === node.name ? { ...n, name: newName } : n
      );
      setNodes(newNodes);
    },
    [nodes]
  );

  return (
    <Stack spacing={2}>
      <TextField
        variant="standard"
        label={t("Workflow Name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Tabs
        value={editingNode}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(e, value) => {
          setEditingNode(value);
        }}
      >
        {nodes.map((node) => (
          <Tab
            key={node.name}
            label={node.name}
            value={node}
            sx={{ textTransform: "none" }}
            onClick={() => {
              setEditingNode(node);
            }}
          />
        ))}
        <Tab
          icon={<AddIcon />}
          onClick={() => {
            for (let i = 0; i < 1000; i++) {
              const name = `Node ${i + 1}`;
              if (!nodes.find((node) => node.name === name)) {
                const newNode: Node = {
                  name,
                  type: "user-input",
                  next: nodes[0]?.name,
                };
                setNodes([...nodes, newNode]);
                setEditingNode(newNode);
                break;
              }
            }
          }}
        />
      </Tabs>
      {editingNode && (
        <NodeForm
          node={editingNode}
          nodes={nodes}
          onUpdateNode={updateNode}
          onRenameNode={renameNode}
        />
      )}
      <Stack direction="row" spacing={2} justifyContent="end">
        <Button
          variant="contained"
          onClick={() => {
            onWorkflowChange({ name, nodes });
          }}
        >
          {t("Save")}
        </Button>
        <Button variant="contained" onClick={onWorkflowDelete} color="error">
          {t("Delete")}
        </Button>
      </Stack>
    </Stack>
  );
}

export default WorkflowForm;
