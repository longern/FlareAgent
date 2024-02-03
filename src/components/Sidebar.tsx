import {
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
  Stack,
  Theme,
  useMediaQuery,
} from "@mui/material";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import React, { useCallback, useEffect, useState } from "react";
import { Workflow, defaultWorkflow } from "../workflow";
import { useTranslation } from "react-i18next";
import { useGlobalComponents } from "./global/GlobalComponents";
import { useWorkflowsState } from "./ActionsProvider";

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
  const { workflows, newWorkflow } = useWorkflowsState();

  const { FilesDialog, SettingsDialog, WorkflowDialog } = useGlobalComponents();
  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const { t } = useTranslation();

  const handleNewChat = useCallback(() => {
    onNewChat();
    onClose();
  }, [onNewChat, onClose]);

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

  const workflowsWithDefault =
    workflows === null ? null : [defaultWorkflow, ...workflows];

  return (
    <Drawer
      variant={matchesLg ? "permanent" : "temporary"}
      open={open}
      anchor="left"
      sx={{
        width: "320px",
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: "320px",
          boxSizing: "border-box",
        },
      }}
      onClose={onClose}
    >
      <Stack height="100%">
        {modelSelector ? (
          <Stack sx={{ px: 2, py: 1 }}>{modelSelector}</Stack>
        ) : null}
        <List sx={{ flexGrow: 1, minHeight: 0 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleNewChat}>
              <ListItemText primary={t("New Chat")} />
            </ListItemButton>
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
                        WorkflowDialog.edit(workflow);
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
          </Collapse>
        </List>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={FilesDialog.open}>
              <ListItemText primary={t("My Files")} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={SettingsDialog.open}>
              <ListItemText primary={t("Settings")} />
            </ListItemButton>
          </ListItem>
        </List>
      </Stack>
    </Drawer>
  );
}

export default Sidebar;
