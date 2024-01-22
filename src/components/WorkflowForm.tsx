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
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import type { Edge, Node, Workflow } from "../workflow";

function NodeForm({
  node,
  nodes,
  onUpdateNode,
  onDeleteNode,
  edges,
  onEdgesChange,
}: {
  node: Node;
  nodes: Node[];
  onUpdateNode: (node: Node) => void;
  onDeleteNode: (node: Node) => void;
  edges: Edge[];
  onEdgesChange: (edges: Edge[]) => void;
}) {
  const { t } = useTranslation();

  const allNodeItems = nodes
    .filter((n) => n.type !== "start")
    .map((n) => (
      <MenuItem key={n.id} value={n.id}>
        {n.data.label}
      </MenuItem>
    ));

  return (
    <Stack spacing={2} sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FormControl fullWidth>
          <InputLabel id="node-type-label">{t("Node Type")}</InputLabel>
          <Select
            label={t("Node Type")}
            labelId="node-type-label"
            value={node.type}
            disabled
          >
            <MenuItem value={node.type}>{node.type}</MenuItem>
          </Select>
        </FormControl>
        <Box>
          <IconButton
            disabled={node.type === "start"}
            onClick={() => onDeleteNode(node)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Stack>
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
      {node.type === "decision" ? (
        <>
          <FormControl>
            <InputLabel id="condition-type-label">
              {t("Condition Type")}
            </InputLabel>
            <Select
              label={t("Condition Type")}
              labelId="condition-type-label"
              value={node.data.condition?.type ?? ""}
              onChange={(e) => {
                switch (e.target.value) {
                  case "tool-call":
                    onUpdateNode({
                      ...node,
                      data: { ...node.data, condition: { type: "tool-call" } },
                    });
                    break;
                  case "regex":
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        condition: { type: "regex", regex: "" },
                      },
                    });
                    break;
                }
              }}
              inputProps={{ "aria-label": node.data.label }}
            >
              <MenuItem value="" disabled>
                &nbsp;
              </MenuItem>
              <MenuItem value="tool-call">{t("Tool Call")}</MenuItem>
              <MenuItem value="regex">{t("Regex")}</MenuItem>
            </Select>
          </FormControl>
          {node.data.condition?.type === "regex" && (
            <TextField
              label={t("Regex")}
              value={node.data.condition.regex}
              onChange={(e) => {
                onUpdateNode({
                  ...node,
                  data: {
                    ...node.data,
                    condition: {
                      type: "regex",
                      regex: e.target.value,
                    },
                  },
                });
              }}
            />
          )}
          <FormControl>
            <InputLabel id="true-node-label">{t("True Node")}</InputLabel>
            <Select
              label={t("True Node")}
              labelId="true-node-label"
              value={
                edges.find(
                  (edge) => edge.source === node.id && edge.data?.condition
                )?.target ?? ""
              }
              onChange={(e) => {
                onEdgesChange([
                  ...edges.filter(
                    (edge) => edge.source !== node.id || !edge.data?.condition
                  ),
                  {
                    id: `e-${node.id}-${e.target.value}`,
                    source: node.id,
                    target: e.target.value,
                    data: { condition: true },
                  },
                ]);
              }}
              inputProps={{ "aria-label": node.data.label }}
            >
              {allNodeItems}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="false-node-label">{t("False Node")}</InputLabel>
            <Select
              label={t("False Node")}
              labelId="false-node-label"
              value={
                edges.find(
                  (edge) => edge.source === node.id && !edge.data?.condition
                )?.target ?? ""
              }
              onChange={(e) => {
                onEdgesChange([
                  ...edges.filter(
                    (edge) => edge.source !== node.id || edge.data?.condition
                  ),
                  {
                    id: `e-${node.id}-${e.target.value}`,
                    source: node.id,
                    target: e.target.value,
                  },
                ]);
              }}
              inputProps={{ "aria-label": node.data.label }}
            >
              {allNodeItems}
            </Select>
          </FormControl>
        </>
      ) : node.type === "assistant" ? (
        <TextField
          label={t("System Prompt")}
          value={node.data.prompt}
          multiline
          rows={8}
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { ...node.data, prompt: e.target.value },
            });
          }}
        />
      ) : node.type === "code" ? (
        <TextField
          label={t("Code")}
          value={node.data.code}
          multiline
          rows={8}
          InputProps={{ sx: { fontFamily: "Consolas, Monaco, monospace" } }}
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { ...node.data, code: e.target.value },
            });
          }}
        />
      ) : null}
      {node.type !== "decision" && (
        <FormControl>
          <InputLabel id="next-node-label">{t("Next Node")}</InputLabel>
          <Select
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
            {allNodeItems}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
}

function WorkflowForm({
  workflow,
  onWorkflowChange,
  onWorkflowDelete,
  onUnsavedChanges,
}: {
  workflow: Workflow;
  onWorkflowChange: (workflow: Workflow) => void;
  onWorkflowDelete: () => void;
  onUnsavedChanges?: (unsavedChanges: boolean) => void;
}) {
  const [name, setName] = React.useState<string>(workflow.name);
  const [nodes, setNodes] = React.useState<Node[]>(workflow.nodes);
  const [edges, setEdges] = React.useState<Edge[]>(workflow.edges);
  const [editingNode, setEditingNode] = React.useState<Node | undefined>(
    nodes[0]
  );
  const onUnsavedChangesRef = React.useRef(onUnsavedChanges);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const { t } = useTranslation();

  const updateNode = useCallback((node: Node) => {
    setNodes((nodes) => nodes.map((n) => (n.id === node.id ? node : n)));
    setEditingNode(node);
    onUnsavedChangesRef.current?.(true);
  }, []);

  const deleteNode = useCallback(
    (node: Node) => {
      setNodes((nodes) => nodes.filter((n) => n.id !== node.id));
      setEdges((edges) => edges.filter((edge) => edge.source !== node.id));
      setEditingNode(nodes[0]);
      onUnsavedChangesRef.current?.(true);
    },
    [nodes]
  );

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
          <MenuItem
            onClick={() => {
              addNode("code");
              setAnchorEl(null);
            }}
          >
            {t("Code")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              addNode("decision");
              setAnchorEl(null);
            }}
          >
            {t("Decision")}
          </MenuItem>
        </Menu>
      </Stack>
      {editingNode && (
        <NodeForm
          node={editingNode}
          nodes={nodes}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
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
