import {
  Avatar,
  Box,
  Collapse,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Radio,
  Select,
  Stack,
  Theme,
  useMediaQuery,
} from "@mui/material";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import React, { useCallback, useEffect, useState } from "react";
import { Workflow, defaultWorkflow } from "../../workflow";
import { useTranslation } from "react-i18next";
import { useWorkflowsState } from "../ActionsProvider";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { showFiles, showSettings, showWorkflow } from "../../app/dialogs";
import { setAvatar } from "../../app/identity";
import ConversationList from "./ConversationList";
import { useModels } from "../hooks";

function WorkflowList({
  currentWorkflow,
  onWorkflowChange,
}: {
  currentWorkflow: Workflow | null;
  onWorkflowChange: (workflow: Workflow) => void;
}) {
  const { workflows, newWorkflow } = useWorkflowsState();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const workflowsWithDefault =
    workflows === null ? null : [defaultWorkflow, ...workflows];

  useEffect(() => {
    if (
      workflows !== null &&
      currentWorkflow !== null &&
      currentWorkflow !== defaultWorkflow &&
      !workflows.includes(currentWorkflow)
    ) {
      onWorkflowChange(defaultWorkflow);
    }
  }, [workflows, currentWorkflow, onWorkflowChange]);

  return (
    <List sx={{ pl: 2 }} disablePadding>
      {workflowsWithDefault === null ? (
        <ListItem>
          <ListItemText primary={t("Loading...")} />
        </ListItem>
      ) : (
        workflowsWithDefault.map((workflow) => (
          <ListItem
            disablePadding
            key={workflow.name}
            secondaryAction={
              <Radio
                checked={currentWorkflow?.name === workflow.name}
                onChange={() => onWorkflowChange(workflow)}
                value={workflow.name}
                name="workflow"
                inputProps={{ "aria-label": workflow.name }}
              />
            }
          >
            <ListItemButton
              onClick={() => {
                if (workflow === defaultWorkflow) return;
                dispatch(showWorkflow(workflow));
              }}
            >
              <ListItemText>{workflow.name}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))
      )}
      <ListItem disablePadding>
        <ListItemButton onClick={newWorkflow}>
          <ListItemText>{t("New...")}</ListItemText>
        </ListItemButton>
      </ListItem>
    </List>
  );
}

export function useModel() {
  const [model, setModel] = useState(
    localStorage.getItem("OPENAI_MODEL") ?? "gpt-3.5-turbo"
  );

  useEffect(() => {
    localStorage.setItem("OPENAI_MODEL", model);
  }, [model]);

  return [model, setModel] as const;
}

export function ModelSelector({
  model,
  onModelChange,
}: {
  model: string;
  onModelChange: (model: string) => void;
}) {
  const models = useModels();

  return (
    <Select
      variant="standard"
      value={model}
      onChange={(e) => {
        onModelChange(e.target.value);
      }}
      inputProps={{ "aria-label": "model" }}
    >
      {models ? (
        models.map((model) => (
          <MenuItem key={model} value={model}>
            {model}
          </MenuItem>
        ))
      ) : (
        <MenuItem value={model}>{model}</MenuItem>
      )}
    </Select>
  );
}

function Sidebar({
  open,
  onClose,
  onNewChat,
  modelSelector,
  currentWorkflow,
  onWorkflowChange,
}: {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  modelSelector?: React.ReactNode;
  currentWorkflow: Workflow | null;
  onWorkflowChange: (workflow: Workflow) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const avatarUrl = useAppSelector((state) => state.identity.avatarUrl);
  const userId = useAppSelector((state) => state.identity.id);
  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const handleNewChat = useCallback(() => {
    onNewChat();
    onClose();
  }, [onNewChat, onClose]);

  return (
    <Drawer
      variant={matchesLg ? "permanent" : "temporary"}
      open={open}
      anchor="left"
      sx={{
        width: "320px",
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: "320px", boxSizing: "border-box" },
      }}
      onClose={onClose}
    >
      <Stack height="100%">
        {matchesLg ? (
          <Stack sx={{ px: 2, py: 1 }}>{modelSelector}</Stack>
        ) : null}
        <Stack
          direction="row"
          spacing={2}
          sx={{ padding: 2, alignItems: "center" }}
        >
          <IconButton component="label" sx={{ p: 0 }}>
            <Avatar src={avatarUrl} sx={{ width: 64, height: 64 }} />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                if (!event.target.files) return;
                dispatch(setAvatar(event.target.files[0]));
                event.target.value = "";
              }}
            />
          </IconButton>
          <Box
            sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {userId}
          </Box>
        </Stack>
        <List sx={{ flexGrow: 1, minHeight: 0 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleNewChat}>
              <ListItemText primary={t("New Chat")} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ConversationList />
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setExpanded(expanded === "workflow" ? null : "workflow");
              }}
            >
              <ListItemText primary={t("Workflow")} />
              {expanded === "workflow" ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </ListItemButton>
          </ListItem>
          <Collapse in={expanded === "workflow"}>
            <WorkflowList
              currentWorkflow={currentWorkflow}
              onWorkflowChange={onWorkflowChange}
            />
          </Collapse>
        </List>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => dispatch(showFiles())}>
              <ListItemText primary={t("My Files")} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => dispatch(showSettings())}>
              <ListItemText primary={t("Settings")} />
            </ListItemButton>
          </ListItem>
        </List>
      </Stack>
    </Drawer>
  );
}

export default Sidebar;
