import {
  Collapse,
  Dialog,
  DialogContent,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
  Stack,
  TextField,
  Theme,
  useMediaQuery,
} from "@mui/material";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import React, { useCallback } from "react";
import { OpenAPIV3 } from "openapi-types";
import { Workflow } from "../workflow";
import { useTranslation } from "react-i18next";

function useApiKey() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    const apiKey = localStorage.getItem("openaiApiKey");
    if (apiKey) {
      setApiKey(apiKey);
    }
  }, []);

  React.useEffect(() => {
    if (apiKey) {
      localStorage.setItem("openaiApiKey", apiKey);
    } else {
      localStorage.removeItem("openaiApiKey");
    }
  }, [apiKey]);

  return [apiKey, setApiKey] as const;
}

function Sidebar({
  open,
  onClose,
  onNewChat,
  modelSelector,
  tools,
  workflows,
  onNewWorkflow,
  onEditWorkflow,
  currentWorkflow,
  onWorkflowChange,
}: {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  modelSelector?: React.ReactNode;
  tools: OpenAPIV3.Document[];
  workflows: Workflow[] | null;
  onNewWorkflow: () => void;
  onEditWorkflow: (workflow: Workflow) => void;
  currentWorkflow: Workflow | null;
  onWorkflowChange: (workflow: Workflow) => void;
}) {
  const [showSettings, setShowSettings] = React.useState<boolean>(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [apiKey, setApiKey] = useApiKey();

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const { t } = useTranslation();

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
              {workflows === null ? (
                <ListItem>
                  <ListItemText primary={t("Loading...")} />
                </ListItem>
              ) : (
                workflows.map((workflow) => (
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
                    <ListItemButton onClick={() => onEditWorkflow(workflow)}>
                      <ListItemText>{workflow.name}</ListItemText>
                    </ListItemButton>
                  </ListItem>
                ))
              )}
              <ListItem disablePadding>
                <ListItemButton onClick={onNewWorkflow}>
                  <ListItemText>New...</ListItemText>
                </ListItemButton>
              </ListItem>
            </List>
          </Collapse>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setExpanded(expanded === "tools" ? null : "tools");
              }}
            >
              <ListItemText primary={t("Tools")} />
              {expanded === "tools" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          <Collapse in={expanded === "tools"}>
            <List sx={{ pl: 2 }} disablePadding>
              {tools.map((tool) => (
                <ListItem key={tool.info.title}>
                  <ListItemText>{tool.info.title}</ListItemText>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </List>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setShowSettings(true)}>
              <ListItemText primary={t("Settings")} />
            </ListItemButton>
          </ListItem>
        </List>
      </Stack>
      <Dialog open={showSettings} onClose={() => setShowSettings(false)}>
        <DialogContent>
          <TextField
            label={t("API Key")}
            fullWidth
            variant="standard"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}

export default Sidebar;
