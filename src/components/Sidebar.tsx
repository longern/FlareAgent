import {
  Collapse,
  Dialog,
  DialogContent,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
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
}: {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  modelSelector?: React.ReactNode;
  tools: OpenAPIV3.Document[];
}) {
  const [showSettings, setShowSettings] = React.useState<boolean>(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [apiKey, setApiKey] = useApiKey();

  const matchesLg = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

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
              <ListItemText>New Chat</ListItemText>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setExpanded(expanded === "system" ? null : "system");
              }}
            >
              <ListItemText>System</ListItemText>
              {expanded === "system" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          <Collapse in={expanded === "system"}>
            <List sx={{ pl: 2 }} disablePadding>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText>Empty</ListItemText>
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText>New Prompt...</ListItemText>
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
              <ListItemText>Tools</ListItemText>
              {expanded === "tools" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          <Collapse in={expanded === "tools"}>
            <List sx={{ pl: 2 }} disablePadding>
              {tools.map((tool) => (
                <ListItem disablePadding key={tool.info.title}>
                  <ListItemButton>
                    <ListItemText>{tool.info.title}</ListItemText>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </List>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setShowSettings(true)}>
              <ListItemText>Settings</ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      </Stack>
      <Dialog open={showSettings} onClose={() => setShowSettings(false)}>
        <DialogContent>
          <TextField
            label="API Key"
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
