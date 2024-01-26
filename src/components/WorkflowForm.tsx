import React, { Suspense, useCallback } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
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

import type { DecisionNode, Edge, Node, Workflow } from "../workflow";

const PythonEditor = React.lazy(async () => {
  const [{ default: CodeMirror }, { python }] = await Promise.all([
    import("@uiw/react-codemirror"),
    import("@codemirror/lang-python"),
  ]);
  return {
    default: ({
      value,
      onChange,
    }: {
      value: string;
      onChange: (value: string) => void;
    }) => (
      <CodeMirror
        value={value}
        height="18em"
        extensions={[python()]}
        onChange={onChange}
      />
    ),
  };
});

function DecisionForm({
  node,
  nodes,
  onUpdateNode,
  edges,
  onEdgesChange,
}: {
  node: DecisionNode;
  nodes: Node[];
  onUpdateNode: (node: Node) => void;
  edges: Edge[];
  onEdgesChange: (edges: Edge[]) => void;
}) {
  const { t } = useTranslation();

  const condition = node.data.condition;
  const allNodeItems = nodes
    .filter((n) => n.type !== "start")
    .map((n) => (
      <MenuItem key={n.id} value={n.id}>
        {n.data.label}
      </MenuItem>
    ));

  return (
    <>
      <FormControl>
        <InputLabel id="condition-type-label">{t("Condition Type")}</InputLabel>
        <Select
          label={t("Condition Type")}
          labelId="condition-type-label"
          value={condition?.type ?? ""}
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
              case "variable":
                onUpdateNode({
                  ...node,
                  data: {
                    ...node.data,
                    condition: {
                      type: "variable",
                      variable: "",
                      operator: "eq",
                      rhs: "",
                    },
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
          <MenuItem value="variable">{t("Variable")}</MenuItem>
        </Select>
      </FormControl>
      {node.data.condition?.type === "regex" ? (
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
      ) : condition?.type === "variable" ? (
        <Stack direction="row" spacing={2}>
          <TextField
            label={t("Variable")}
            value={condition.variable}
            onChange={(e) => {
              onUpdateNode({
                ...node,
                data: {
                  ...node.data,
                  condition: {
                    ...condition,
                    variable: e.target.value,
                  },
                },
              });
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControl sx={{ minWidth: 64 }}>
            <InputLabel id="operator-label">{t("Operator")}</InputLabel>
            <Select
              label={t("Operator")}
              labelId="operator-label"
              value={condition.operator}
              onChange={(e) => {
                const operator = e.target.value as typeof condition.operator;
                onUpdateNode({
                  ...node,
                  data: {
                    ...node.data,
                    condition: { ...condition, operator },
                  },
                });
              }}
              inputProps={{ "aria-label": node.data.label }}
            >
              <MenuItem value="eq">=</MenuItem>
              <MenuItem value="ne">≠</MenuItem>
              <MenuItem value="gt">&gt;</MenuItem>
              <MenuItem value="gte">≥</MenuItem>
              <MenuItem value="lt">&lt;</MenuItem>
              <MenuItem value="lte">≤</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={t("RHS")}
            value={condition.rhs}
            onChange={(e) => {
              onUpdateNode({
                ...node,
                data: {
                  ...node.data,
                  condition: { ...condition, rhs: e.target.value },
                },
              });
            }}
            sx={{ flexGrow: 1 }}
          />
        </Stack>
      ) : null}
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
  );
}

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
        <DecisionForm
          node={node}
          nodes={nodes}
          onUpdateNode={onUpdateNode}
          edges={edges}
          onEdgesChange={onEdgesChange}
        />
      ) : node.type === "assistant" ? (
        <>
          <TextField
            label={t("System Prompt")}
            value={node.data.prompt ?? ""}
            multiline
            rows={8}
            onChange={(e) => {
              onUpdateNode({
                ...node,
                data: { ...node.data, prompt: e.target.value },
              });
            }}
          />
          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={node.data.pipeToVariable !== undefined}
                  onChange={(e) => {
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        pipeToVariable: e.target.checked ? "" : undefined,
                      },
                    });
                  }}
                />
              }
              label={t("Pipe to Variable")}
              sx={{ flexShrink: 0 }}
            />
            <TextField
              label={t("Variable Name")}
              value={node.data.pipeToVariable ?? ""}
              disabled={node.data.pipeToVariable === undefined}
              fullWidth
              onChange={(e) => {
                onUpdateNode({
                  ...node,
                  data: { ...node.data, pipeToVariable: e.target.value },
                });
              }}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={(node.data.tools ?? []).includes("search")}
                  onChange={(e) => {
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        tools: e.target.checked
                          ? (node.data.tools ?? []).concat("search")
                          : (node.data.tools ?? []).filter(
                              (tool) => tool !== "search"
                            ),
                      },
                    });
                  }}
                />
              }
              label={t("Search")}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={(node.data.tools ?? []).includes("python")}
                  onChange={(e) => {
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        tools: e.target.checked
                          ? (node.data.tools ?? []).concat("python")
                          : (node.data.tools ?? []).filter(
                              (tool) => tool !== "python"
                            ),
                      },
                    });
                  }}
                />
              }
              label={t("Python")}
            />
          </Stack>
        </>
      ) : node.type === "code" ? (
        <Suspense
          fallback={
            <Box
              sx={{
                display: "flex",
                height: "18em",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress />
            </Box>
          }
        >
          <PythonEditor
            value={node.data.code}
            onChange={(value) => {
              onUpdateNode({
                ...node,
                data: { ...node.data, code: value },
              });
            }}
          />
        </Suspense>
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
