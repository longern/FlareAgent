import React, { useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import type { Edge, Node, Workflow } from "../workflow";

function NodeForm({
  node,
  nodes,
  onUpdateNode,
  edges,
  onEdgesChange,
}: {
  node: Node;
  nodes: Node[];
  onUpdateNode: (node: Node) => void;
  edges: Edge[];
  onEdgesChange: (edges: Edge[]) => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack spacing={2} sx={{ py: 2 }}>
      <TextField
        label={t("Node Label")}
        value={node.data.label}
        onChange={(e) => {
          onUpdateNode({
            ...node,
            data: { ...node.data, label: e.target.value },
          });
        }}
      />
      {node.type === "start" || node.type === "user-input" ? (
        <FormControl>
          <InputLabel id="next-node-label">{t("Next Node")}</InputLabel>
          <Select
            key={node.id}
            label={t("Next Node")}
            labelId="next-node-label"
            value={edges.find((edge) => edge.source === node.id)?.target ?? ""}
            onChange={(e) => {
              onEdgesChange([
                ...edges.filter((edge) => edge.source !== node.id),
                {
                  id: `e-${node.id}-${e.target.value}`,
                  source: node.id,
                  target: e.target.value,
                },
              ]);
            }}
            inputProps={{ "aria-label": node.data.label }}
          >
            {nodes
              .filter((n) => n.type !== "start")
              .map((n) => (
                <MenuItem key={n.id} value={n.id}>
                  {n.data.label}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      ) : node.type === "assistant" ? (
        <TextField
          key={node.id}
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
            key={node.id}
            label={t("Next Node")}
            labelId="next-node-label"
            value={edges.find((edge) => edge.source === node.id)?.target ?? ""}
            onChange={(e) => {
              onEdgesChange([
                ...edges.filter((edge) => edge.source !== node.id),
                {
                  id: `e-${node.id}-${e.target.value}`,
                  source: node.id,
                  target: e.target.value,
                },
              ]);
            }}
            inputProps={{ "aria-label": node.data.label }}
          >
            {nodes
              .filter((n) => n.type !== "start")
              .map((n) => (
                <MenuItem key={n.id} value={n.id}>
                  {n.data.label}
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
  const [edges, setEdges] = React.useState<Edge[]>(workflow.edges);
  const [editingNode, setEditingNode] = React.useState<Node | undefined>(
    nodes[0]
  );

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const { t } = useTranslation();

  const updateNode = useCallback((node: Node) => {
    setNodes((nodes) => nodes.map((n) => (n.id === node.id ? node : n)));
    setEditingNode(node);
  }, []);

  const addNode = useCallback(
    (type: Node["type"]) => {
      for (let i = 0; i < 1000; i++) {
        const id = `node-${i + 1}`;
        const label = `Node ${i + 1}`;
        if (nodes.find((node) => node.id === id)) {
          continue;
        }
        const newNode: Node = {
          id,
          type,
          data: { label },
        };
        setNodes([...nodes, newNode]);
        setEditingNode(newNode);
        break;
      }
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
      <Stack direction="row" alignItems="center">
        <Tabs
          value={editingNode}
          variant="scrollable"
          scrollButtons="auto"
          onChange={(_e, value) => {
            setEditingNode(value);
          }}
        >
          {nodes.map((node) => (
            <Tab
              key={node.id}
              label={node.data.label}
              value={node}
              sx={{ textTransform: "none" }}
            />
          ))}
        </Tabs>
        <Box>
          <IconButton
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => {
            setAnchorEl(null);
          }}
        >
          <MenuItem
            onClick={() => {
              addNode("user-input");
              setAnchorEl(null);
            }}
          >
            {t("User Input")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              addNode("assistant");
              setAnchorEl(null);
            }}
          >
            {t("LLM")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              addNode("tool-call");
              setAnchorEl(null);
            }}
          >
            {t("Tool Call")}
          </MenuItem>
        </Menu>
      </Stack>
      {editingNode && (
        <NodeForm
          node={editingNode}
          nodes={nodes}
          onUpdateNode={updateNode}
          edges={edges}
          onEdgesChange={setEdges}
        />
      )}
      <Stack direction="row" spacing={2} justifyContent="end">
        <Button
          variant="contained"
          onClick={() => {
            onWorkflowChange({ name, nodes, edges });
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
